/**
 * hooks/useVoiceTranscription.ts - compatibility wrapper.
 *
 * Keeps the previous hook contract while delegating to useSpeechRecognition.
 */

import { useSpeechRecognition } from './useSpeechRecognition';

export interface UseVoiceTranscriptionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
}

export function useVoiceTranscription(lang = 'pt-BR'): UseVoiceTranscriptionReturn {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition(lang);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(
      (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
  };
}
