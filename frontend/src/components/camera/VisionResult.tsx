/**
 * components/camera/VisionResult.tsx – Exibe resultado da pipeline de visão.
 *
 * Mostra ao usuário:
 * - Itens identificados na foto
 * - Intervalo de confiança ("Entre 420 e 580 kcal")
 * - Notas de incerteza
 * - Botão para aceitar/editar resultado
 *
 * TODO: implementar com ParsedItemsList e ConfidenceBadge.
 */

import type { ParsedNutrition } from '../../types/food';
import { GlassCard } from '../ui/GlassCard';

interface VisionResultProps {
  result: ParsedNutrition;
}

/**
 * Exibe o resultado da análise de foto.
 */
export function VisionResult({ result }: VisionResultProps) {
  const { totals, estimatedErrorPct, uncertaintyNotes } = result;
  const errorMargin = estimatedErrorPct ?? 15;
  const low = Math.round(totals.calories * (1 - errorMargin / 100));
  const high = Math.round(totals.calories * (1 + errorMargin / 100));

  return (
    <GlassCard>
      <h3 className="font-semibold mb-2">Resultado da análise</h3>
      <p className="text-2xl font-bold">
        Entre {low} e {high} kcal
        <span className="text-xs text-slate-400 ml-2">(estimativa)</span>
      </p>
      {uncertaintyNotes && (
        <p className="text-xs text-yellow-400 mt-2">⚠️ {uncertaintyNotes}</p>
      )}
      {/* TODO: <ParsedItemsList items={result.items} /> */}
      {/* TODO: botões aceitar / editar */}
    </GlassCard>
  );
}
