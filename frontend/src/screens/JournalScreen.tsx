/**
 * screens/JournalScreen.tsx - Apple Notes-style notepad diary.
 *
 * Layout:
 * - Header: mascot, date pill (opens calendar), streak + settings
 * - Notepad: continuous list of meal lines + active input line at bottom
 * - GoalsPanel (hides on keyboard) + ActionBar (follows keyboard)
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useJournalStore } from '../store/journalStore';
import { useDailyTotals } from '../hooks/useDailyTotals';
import { useSettingsStore } from '../store/settingsStore';
import { useKeyboardOffset } from '../hooks/useKeyboardOffset';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { GoalsPanel } from '../components/journal/GoalsPanel';
import { ActionBar } from '../components/journal/ActionBar';
import { DatePicker } from '../components/ui/DatePicker';
import type { MealEntry } from '../types/food';

interface JournalScreenProps {
  onOpenSettings: () => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function EntryRow({ entry }: { entry: MealEntry }) {
  const cal = entry.parsedResult ? Math.round(entry.parsedResult.totals.calories) : null;

  return (
    <div className="notepad-row">
      <p className="notepad-text">{entry.rawText}</p>
      <span className="notepad-meta">
        {entry.isDirty && !entry.parsedResult ? (
          <span className="notepad-thinking">Thinking</span>
        ) : cal !== null ? (
          <span className="notepad-cal">⚡ {cal} cal</span>
        ) : null}
      </span>
    </div>
  );
}

export function JournalScreen({ onOpenSettings }: JournalScreenProps) {
  const entries = useJournalStore((s) => s.entries);
  const selectedDate = useJournalStore((s) => s.selectedDate);
  const setDate = useJournalStore((s) => s.setDate);
  const addTextEntry = useJournalStore((s) => s.addTextEntry);
  const addImageEntry = useJournalStore((s) => s.addImageEntry);

  const addSavedMeal = useSettingsStore((s) => s.addSavedMeal);
  const { totals } = useDailyTotals();
  const goals = useSettingsStore((s) => s.goals);
  const keyboardOffset = useKeyboardOffset();

  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<'none' | 'left' | 'right'>('none');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Scroll to bottom when new entries arrive or text changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  // Navigate to previous/next day
  const goToDay = useCallback(
    (offset: number) => {
      const d = new Date(`${selectedDate}T12:00:00`);
      d.setDate(d.getDate() + offset);
      const dir = offset > 0 ? 'left' : 'right';
      setSwipeAnim(dir);
      setTimeout(() => {
        setDate(toDateStr(d));
        setSwipeAnim('none');
      }, 150);
    },
    [selectedDate, setDate],
  );

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => goToDay(1),
    onSwipeRight: () => goToDay(-1),
  });

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  // Mirror transcription into the input
  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  const focusInput = () => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      return;
    }
    focusInput();
    clearTranscript();
    startListening();
  };

  const handleSubmit = async () => {
    if (isListening) stopListening();

    const raw = text.trim();
    if (!raw) return;

    await addTextEntry(raw);
    setText('');
    clearTranscript();
    // Keep focus on the textarea so the next entry can be typed immediately
    setTimeout(() => textareaRef.current?.focus(), 30);
  };

  const handleImageSelected = async (file: File, source: 'camera' | 'library') => {
    const imageUrl = URL.createObjectURL(file);
    await addImageEntry(imageUrl);
    console.log('Image queued for AI parsing:', { source, name: file.name });
  };

  const handleAddSavedMeal = () => {
    const currentText = text.trim();
    const latestEntry = entries[entries.length - 1];

    const sourceText =
      currentText ||
      latestEntry?.rawText?.trim() ||
      latestEntry?.parsedResult?.items.map((item) => item.name).join(', ') ||
      '';

    if (!sourceText) {
      focusInput();
      window.alert('Digite uma refeicao primeiro para salvar como Saved Meal.');
      return;
    }

    const suggestedName =
      sourceText.length > 32 ? `${sourceText.slice(0, 32).trim()}...` : sourceText;
    const name = window.prompt('Nome da Saved Meal:', suggestedName);
    if (!name || !name.trim()) return;

    const parsedTotals = latestEntry?.parsedResult?.totals;

    addSavedMeal({
      name: name.trim(),
      items: sourceText,
      calories: parsedTotals ? Math.round(parsedTotals.calories) : 0,
      protein_g: parsedTotals ? Math.round(parsedTotals.protein_g) : 0,
      carbs_g: parsedTotals ? Math.round(parsedTotals.carbs_g) : 0,
      fat_g: parsedTotals ? Math.round(parsedTotals.fat_g) : 0,
    });

    window.alert(`Saved Meal "${name.trim()}" registrada.`);
  };

  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  const contentStyle = useMemo(() => {
    if (swipeAnim === 'left') {
      return { opacity: 0, transform: 'translateX(-30px)', transition: 'all 0.15s ease-out' };
    }
    if (swipeAnim === 'right') {
      return { opacity: 0, transform: 'translateX(30px)', transition: 'all 0.15s ease-out' };
    }
    return { opacity: 1, transform: 'translateX(0)', transition: 'all 0.2s ease-out' };
  }, [swipeAnim]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 flex-shrink-0 relative"
        style={{ paddingTop: 'calc(12px + var(--safe-top))' }}
      >
        <div className="w-10 h-10 flex items-center justify-center text-2xl">🥗</div>

        <button
          className="pill"
          id="today-pill"
          onClick={() => setCalendarOpen(!calendarOpen)}
        >
          {dateLabel}
        </button>

        <div className="flex items-center gap-2">
          <span className="pill text-sm">
            <span>🔥</span>
            <span>1</span>
          </span>
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            id="settings-btn"
            aria-label="Configuracoes"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <DatePicker
          isOpen={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setDate(date);
            setCalendarOpen(false);
          }}
        />
      </header>

      {/* Notepad */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pt-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
        {...swipeHandlers}
        onClick={focusInput}
      >
        <div style={contentStyle}>
          {/* Voice indicator */}
          {isListening && (
            <div className="notepad-row mb-1">
              <span className="notepad-thinking flex items-center gap-1.5">
                <span className="voice-indicator-dot" />
                Ouvindo…
              </span>
            </div>
          )}

          {speechError && (
            <div className="notepad-row mb-1">
              <span className="text-red-400 text-sm">{speechError}</span>
            </div>
          )}

          {/* Logged entries */}
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}

          {/* Active input line */}
          <div className="notepad-row notepad-input-row">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={entries.length === 0 ? 'Start logging your meals…' : ''}
              className="notepad-textarea"
              rows={1}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Goals panel */}
      <div
        className="flex-shrink-0"
        style={{
          opacity: keyboardOffset > 0 ? 0 : 1,
          transform: keyboardOffset > 0 ? 'translateY(8px) scale(0.98)' : 'translateY(0) scale(1)',
          filter: keyboardOffset > 0 ? 'blur(8px)' : 'blur(0px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease, filter 0.25s ease',
          pointerEvents: keyboardOffset > 0 ? 'none' : 'auto',
        }}
      >
        <GoalsPanel
          isExpanded={goalsExpanded}
          onToggle={() => setGoalsExpanded(!goalsExpanded)}
          totals={totals}
          goals={goals}
        />
      </div>

      {/* Action bar */}
      <div
        className="flex-shrink-0"
        style={{
          position: keyboardOffset > 0 ? 'fixed' : 'relative',
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined,
          left: 0,
          right: 0,
          zIndex: 30,
          transition: 'bottom 0.15s ease-out',
          background: keyboardOffset > 0 ? 'var(--bg-primary)' : 'transparent',
          borderTop: keyboardOffset > 0 ? '1px solid var(--glass-border)' : 'none',
        }}
      >
        <ActionBar
          calories={Math.round(totals.calories)}
          isListening={isListening}
          onStartEditing={focusInput}
          onAddSavedMeal={handleAddSavedMeal}
          onImageSelected={handleImageSelected}
          onToggleMic={handleToggleMic}
        />
      </div>
    </div>
  );
}
