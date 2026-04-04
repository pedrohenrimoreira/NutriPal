import { useCallback, useState } from "react";

const EXPO_GO_MIC_MESSAGE =
  "O microfone vai voltar em uma proxima etapa. Por enquanto, use o teclado no Expo Go.";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  const startListening = useCallback(async () => {
    setIsListening(false);
    setTranscript("");
    setError(EXPO_GO_MIC_MESSAGE);
    return false;
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
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
