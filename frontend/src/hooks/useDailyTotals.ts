/**
 * hooks/useDailyTotals.ts – Hook para agregar totais nutricionais do dia.
 *
 * Lê as entradas do dia do journalStore e soma os macronutrientes
 * de todos os itens parsed. Usado pelo DailySummary e MacroRing.
 */

import { useMemo } from 'react';
import { useJournalStore } from '../store/journalStore';
import type { NutritionTotals } from '../types/food';

export interface DailyTotalsReturn {
  /** Totais agregados do dia. */
  totals: NutritionTotals;
  /** Número de entradas com parsed result. */
  parsedCount: number;
  /** Número total de entradas do dia. */
  totalCount: number;
}

/**
 * Calcula os totais nutricionais do dia selecionado.
 *
 * @returns totais + contadores
 *
 * TODO: implement – somar parsedResult.totals de cada entry
 */
export function useDailyTotals(): DailyTotalsReturn {
  const entries = useJournalStore((s) => s.entries);

  const { totals, parsedCount } = useMemo(() => {
    const empty: NutritionTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

    let parsed = 0;
    const sum = entries.reduce((acc, entry) => {
      if (entry.parsedResult) {
        parsed++;
        return {
          calories: acc.calories + entry.parsedResult.totals.calories,
          protein_g: acc.protein_g + entry.parsedResult.totals.protein_g,
          carbs_g: acc.carbs_g + entry.parsedResult.totals.carbs_g,
          fat_g: acc.fat_g + entry.parsedResult.totals.fat_g,
        };
      }
      return acc;
    }, empty);

    return { totals: sum, parsedCount: parsed };
  }, [entries]);

  return { totals, parsedCount, totalCount: entries.length };
}
