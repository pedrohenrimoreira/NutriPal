/**
 * components/journal/ActionBar.tsx - Bottom toolbar actions.
 *
 * Camera button behavior:
 * - Opens the native file picker with `accept="image/*"`.
 * - On iOS Safari this maps to the same native flow used by "Choose from Library".
 */

import { useRef, type ChangeEvent } from 'react';

type ImageSource = 'camera' | 'library';

interface ActionBarProps {
  calories: number;
  isListening: boolean;
  onStartEditing: () => void;
  onAddSavedMeal: () => void;
  onImageSelected: (file: File, source: ImageSource) => void;
  onToggleMic: () => void;
}

export function ActionBar({
  calories,
  isListening,
  onStartEditing,
  onAddSavedMeal,
  onImageSelected,
  onToggleMic,
}: ActionBarProps) {
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleLibraryClick = () => {
    libraryInputRef.current?.click();
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onImageSelected(file, 'library');
    e.target.value = '';
  };

  return (
    <div className="action-bar flex-shrink-0">
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <button
        className="pill px-4 py-2.5 mr-1"
        style={{ minWidth: '80px', justifyContent: 'center' }}
      >
        <span className="font-semibold">{calories} kcal</span>
      </button>

      <button
        className="action-btn"
        onClick={onToggleMic}
        aria-label={isListening ? 'Parar gravacao' : 'Gravar voz'}
        id="action-mic"
        style={{
          background: isListening ? 'rgba(239, 68, 68, 0.2)' : undefined,
          borderColor: isListening ? 'rgba(239, 68, 68, 0.4)' : undefined,
          color: isListening ? 'var(--accent-red)' : undefined,
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

      <button
        className="action-btn"
        onClick={handleLibraryClick}
        aria-label="Escolher imagem da biblioteca"
        id="action-camera"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <button
        className="action-btn"
        onClick={onAddSavedMeal}
        aria-label="Salvar refeicao"
        id="action-add"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        className="action-btn"
        onClick={onStartEditing}
        aria-label="Digitar"
        id="action-keyboard"
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
  );
}
