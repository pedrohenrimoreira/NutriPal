/**
 * hooks/useSpeechRecognition.ts - Web Speech API hook for voice-to-text.
 *
 * Mobile notes:
 * - iOS Safari works better with non-continuous sessions.
 * - Browser permission/secure-context errors are handled in onerror.
 */

import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
}

export function useSpeechRecognition(lang = 'pt-BR'): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/i.test(navigator.userAgent);

  const isSecureContextForMic =
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost');

  const isSafari =
    typeof navigator !== 'undefined' &&
    /Safari/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      setError('Permissao de microfone negada. Habilite em Ajustes > Safari > Microfone.');
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    void (async () => {
      if (!isSecureContextForMic) {
        setError('No celular, o microfone exige HTTPS. Abra via https:// no Safari.');
        return;
      }

      const hasMicPermission = await requestMicrophonePermission();
      if (!hasMicPermission) {
        return;
      }

      const speechWindow = window as Window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };

      const SpeechRecognitionAPI =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        if (isIOS && !isSafari) {
          setError('No iPhone, use Safari. Outros navegadores iOS podem bloquear reconhecimento de voz.');
        } else {
          setError('Reconhecimento de voz nao suportado neste navegador.');
        }
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang;
      recognition.continuous = !isIOS;
      recognition.interimResults = !isIOS;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += `${result[0].transcript} `;
          } else {
            interim += result[0].transcript;
          }
        }

        setTranscript((finalTranscriptRef.current + interim).trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(
            'Microfone bloqueado (permissao ou contexto inseguro). No iPhone, abra o app em HTTPS e permita o microfone no Safari.',
          );
        } else if (event.error === 'audio-capture') {
          setError('Nenhum microfone detectado no dispositivo.');
        } else if (event.error === 'network') {
          setError('Falha de rede no reconhecimento de voz. Tente novamente.');
        } else {
          setError(`Erro no reconhecimento de voz: ${event.error}`);
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    })();
  }, [isIOS, isSafari, isSecureContextForMic, lang, requestMicrophonePermission]);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
}
