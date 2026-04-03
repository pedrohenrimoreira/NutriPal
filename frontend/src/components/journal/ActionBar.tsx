/**
 * components/journal/ActionBar.tsx
 *
 * Two modes:
 * - isEditing = false → totals pill (🔥 cal • C • P • F) in normal flow
 * - isEditing = true  → iOS-style inputAccessoryView, position:fixed bottom:0
 *                       Works on iOS Safari 15+ (fixed = visual viewport) and
 *                       Android Chrome (layout resizes → bottom:0 = top of keyboard)
 */

import { useRef, type ChangeEvent } from 'react';
import type { NutritionTotals } from '../../types/food';

type ImageSource = 'camera' | 'library';

interface ActionBarProps {
  totals: NutritionTotals;
  isEditing: boolean;
  isListening: boolean;
  onAddSavedMeal: () => void;
  onImageSelected: (file: File, source: ImageSource) => void;
  onToggleMic: () => void;
  onDismissKeyboard: () => void;
}

export function ActionBar({
  totals,
  isEditing,
  isListening,
  onAddSavedMeal,
  onImageSelected,
  onToggleMic,
  onDismissKeyboard,
}: ActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  /* ── Keyboard closed: macro summary pill in normal flow ── */
  if (!isEditing) {
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

  /* ── Keyboard open: accessory bar fixed at bottom:0 ── */
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
        className="action-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--bg-primary)',
          borderTop: '0.5px solid rgba(255,255,255,0.10)',
          paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 12,
        }}
      >
        {/* Calories pill — left */}
        <button
          className="pill px-4 py-2.5"
          style={{ minWidth: '80px', justifyContent: 'center' }}
        >
          <span>🔥</span>
          <span className="font-semibold">{cal}</span>
        </button>

        {/* Action buttons — right */}
        <div className="flex items-center gap-2">
          {/* Mic */}
          <button
            className="action-btn"
            onClick={onToggleMic}
            aria-label={isListening ? 'Parar gravação' : 'Gravar voz'}
            style={{
              background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)',
              borderColor: isListening ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.3)',
              color: isListening ? '#ef4444' : '#3b82f6',
              animation: isListening ? 'pulse-mic 1.5s ease-in-out infinite' : undefined,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Camera */}
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Escolher imagem"
            style={{
              background: 'rgba(236,72,153,0.15)',
              borderColor: 'rgba(236,72,153,0.3)',
              color: '#ec4899',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Add saved meal */}
          <button
            className="action-btn"
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
            className="action-btn"
            onClick={onDismissKeyboard}
            aria-label="Fechar teclado"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="6" y2="12" />
              <line x1="10" y1="12" x2="10" y2="12" />
              <line x1="14" y1="12" x2="14" y2="12" />
              <line x1="18" y1="12" x2="18" y2="12" />
              <line x1="8" y1="16" x2="16" y2="16" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
