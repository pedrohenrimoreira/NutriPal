/**
 * screens/JournalScreen.tsx - Main diary screen (Amy-inspired).
 *
 * Layout:
 * - Header: mascot, date pill (opens calendar), streak + settings
 * - Scrollable meal log (swipeable to change days)
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
import { MealEntryCard } from '../components/journal/MealEntryCard';
import { ActionBar } from '../components/journal/ActionBar';
import { DatePicker } from '../components/ui/DatePicker';

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
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<'none' | 'left' | 'right'>('none');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

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

  // Keep transcription mirrored in the textarea, including final text after end.
  useEffect(() => {
    if (transcript) {
      setText(transcript);
      if (!isEditing) {
        setIsEditing(true);
      }
    }
  }, [transcript, isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      return;
    }

    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
    clearTranscript();
    startListening();
  };

  const handleSubmit = async () => {
    if (isListening) stopListening();

    const raw = text.trim();
    if (!raw) return;

    await addTextEntry(raw);
    setText('');
    setIsEditing(false);
    clearTranscript();
  };

  const handleImageSelected = async (file: File, source: 'camera' | 'library') => {
    const imageUrl = URL.createObjectURL(file);

    await addImageEntry(imageUrl);

    // TODO: Phase 2 - call /parse/image and attach ParseResponse to this entry.
    console.log('Image queued for AI parsing:', {
      source,
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setIsEditing(false);
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
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
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

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pt-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
        {...swipeHandlers}
      >
        <div style={contentStyle}>
          {isListening && (
            <div className="mb-3">
              <div className="voice-indicator">
                <span className="voice-indicator-dot" />
                <span>Ouvindo...</span>
              </div>
            </div>
          )}

          {speechError && <div className="mb-3 text-xs text-red-400">{speechError}</div>}

          {isEditing ? (
            <div className="animate-fade-in">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="O que voce comeu?..."
                className="w-full bg-transparent resize-none outline-none text-[15px] text-white/90 placeholder-zinc-600 leading-relaxed min-h-[60px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setText('');
                  }}
                  className="px-4 py-2 text-sm text-zinc-400 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                  style={{
                    background: text.trim() ? 'var(--accent-green)' : 'rgba(255,255,255,0.06)',
                    color: text.trim() ? '#000' : 'var(--text-muted)',
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <button
              onClick={handleStartEditing}
              className="w-full text-left text-[15px] text-zinc-500 py-1 transition-colors active:text-zinc-300"
              id="start-logging-btn"
            >
              Start logging your meals...
            </button>
          ) : (
            <div className="space-y-3 stagger">
              {entries.map((entry) => (
                <MealEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>

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
          onStartEditing={handleStartEditing}
          onAddSavedMeal={handleAddSavedMeal}
          onImageSelected={handleImageSelected}
          onToggleMic={handleToggleMic}
        />
      </div>
    </div>
  );
}
