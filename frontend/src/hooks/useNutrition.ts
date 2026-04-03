/**
 * hooks/useNutrition.ts – Hook orquestrador de entrada nutricional.
 *
 * É o ponto de entrada unificado para processar qualquer tipo de input
 * (texto ou foto). Internamente usa o nutritionRouter para decidir
 * a camada e gerencia loading/error states.
 *
 * Conecta:
 * - nutritionRouter (services)
 * - journalStore (Zustand)
 * - uiStore (loading)
 * - cache (IndexedDB)
 */

import { useState, useCallback } from 'react';
import type { ParsedNutrition } from '../types/food';

export interface UseNutritionReturn {
  /** Se está processando uma entrada. */
  isProcessing: boolean;
  /** Resultado mais recente. */
  result: ParsedNutrition | null;
  /** Erro, se houver. */
  error: string | null;
  /** Processa entrada de texto. */
  processText: (rawText: string) => Promise<void>;
  /** Processa entrada de foto. */
  processImage: (imageBlob: Blob, hasRef?: boolean, refDesc?: string) => Promise<void>;
  /** Limpa o resultado atual. */
  clear: () => void;
}

/**
 * Hook para orquestrar o processamento nutricional.
 *
 * @returns controles e estado do processamento
 *
 * TODO: implement – integrar com nutritionRouter e journalStore
 */
export function useNutrition(): UseNutritionReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParsedNutrition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback(async (_rawText: string) => {
    // TODO: implement
    // 1. setIsProcessing(true)
    // 2. Verificar cache
    // 3. Chamar routeTextInput(rawText)
    // 4. Salvar no cache
    // 5. Atualizar journalStore
    void setIsProcessing;
    void setResult;
    void setError;
    throw new Error('TODO: implement processText');
  }, []);

  const processImage = useCallback(
    async (_imageBlob: Blob, _hasRef = false, _refDesc?: string) => {
      // TODO: implement
      // 1. setIsProcessing(true)
      // 2. Chamar routeImageInput(imageBlob, hasRef, refDesc)
      // 3. Atualizar journalStore
      throw new Error('TODO: implement processImage');
    },
    [],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isProcessing, result, error, processText, processImage, clear };
}
