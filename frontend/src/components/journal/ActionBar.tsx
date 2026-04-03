/**
 * components/journal/ActionBar.tsx
 *
 * Two modes:
 * - Keyboard closed → totals pill (🔥 cal • C • P • F)
 * - Keyboard open   → iOS 26 inputAccessoryView glued above keyboard
 */

import { useRef, type ChangeEvent } from 'react';
import type { NutritionTotals } from '../../types/food';

type ImageSource = 'camera' | 'library';

interface ActionBarProps {
  totals: NutritionTotals;
  keyboardOffset: number;
  isListening: boolean;
  onAddSavedMeal: () => void;
  onImageSelected: (file: File, source: ImageSource) => void;
  onToggleMic: () => void;
  onDismissKeyboard: () => void;
}

export function ActionBar({
  totals,
  keyboardOffset,
  isListening,
  onAddSavedMeal,
  onImageSelected,
  onToggleMic,
  onDismissKeyboard,
}: ActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isKeyboardOpen = keyboardOffset > 0;

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelected(file, 'library');
    e.target.value = '';
  };

  const cal = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);

  /* ── Keyboard closed: macro summary pill ── */
  if (!isKeyboardOpen) {
    return (
      <div className="totals-bar">
        <div className="totals-pill">
          <span style={{ color: '#f97316' }}>🔥</span>
          <span>{cal}</span>
          <span className="totals-pill-dot" />
          <span style={{ color: '#06b6d4', fontSize: 13 }}>C</span>
          <span style={{ fontSize: 13 }}>{carbs}</span>
          <span className="totals-pill-dot" />
          <span style={{ color: '#a855f7', fontSize: 13 }}>P</span>
          <span style={{ fontSize: 13 }}>{prot}</span>
          <span className="totals-pill-dot" />
          <span style={{ color: '#eab308', fontSize: 13 }}>F</span>
          <span style={{ fontSize: 13 }}>{fat}</span>
        </div>
      </div>
    );
  }

  /* ── Keyboard open: iOS 26 accessory bar ── */
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div
        className="keyboard-accessory"
        style={{ bottom: keyboardOffset }}
      >
        {/* Left: calories pill */}
        <div className="accessory-cal-pill">
          <span style={{ color: '#f97316' }}>🔥</span>
          <span>{cal}</span>
        </div>

        {/* Right: action icons */}
        <div className="accessory-actions">
          {/* Mic */}
          <button
            className={`accessory-btn${isListening ? ' active' : ''}`}
            onClick={onToggleMic}
            aria-label={isListening ? 'Parar gravação' : 'Gravar voz'}
            style={isListening ? { animation: 'pulse-mic 1.5s ease-in-out infinite' } : undefined}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Camera / library */}
          <button
            className="accessory-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Escolher imagem"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Add saved meal */}
          <button
            className="accessory-btn"
            onClick={onAddSavedMeal}
            aria-label="Adicionar refeição salva"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Dismiss keyboard */}
          <button
            className="accessory-btn"
            onClick={onDismissKeyboard}
            aria-label="Fechar teclado"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="13" rx="2" />
              <line x1="7" y1="8" x2="7" y2="8" strokeWidth="2.5" />
              <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5" />
              <line x1="17" y1="8" x2="17" y2="8" strokeWidth="2.5" />
              <line x1="7" y1="12" x2="7" y2="12" strokeWidth="2.5" />
              <line x1="12" y1="12" x2="12" y2="12" strokeWidth="2.5" />
              <line x1="17" y1="12" x2="17" y2="12" strokeWidth="2.5" />
              <polyline points="9 20 12 17 15 20" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
