/**
 * components/journal/DailySummary.tsx – Card flutuante com totais do dia.
 *
 * Exibe os totais acumulados de calorias e macronutrientes do dia
 * em um card fixo na parte inferior da tela.
 *
 * Usa o hook useDailyTotals para obter os valores.
 *
 * TODO: implementar MacroRings e animação de entrada.
 */

import { useDailyTotals } from '../../hooks/useDailyTotals';
import { GlassCard } from '../ui/GlassCard';

/**
 * Sumário nutricional do dia (fixed bottom).
 */
export function DailySummary() {
  const { totals, parsedCount, totalCount } = useDailyTotals();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{Math.round(totals.calories)} kcal</p>
          <p className="text-xs text-slate-400">
            {parsedCount}/{totalCount} refeições analisadas
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold">{Math.round(totals.protein_g)}g</p>
            <p className="text-xs text-slate-400">Prot</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{Math.round(totals.carbs_g)}g</p>
            <p className="text-xs text-slate-400">Carb</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{Math.round(totals.fat_g)}g</p>
            <p className="text-xs text-slate-400">Gord</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
