/**
 * components/journal/ParsedItemsList.tsx – Lista de itens nutricionais identificados.
 *
 * Exibe os itens retornados pelo parsing (texto ou foto) com:
 * - Nome do alimento
 * - Calorias e macros
 * - Badge de confiança
 * - Badge de origem (dataset / LLM / visão)
 *
 * TODO: implementar lista com expand/collapse por item.
 */

import type { NutritionItem } from '../../types/food';
import { ConfidenceBadge } from '../ui/ConfidenceBadge';

interface ParsedItemsListProps {
  items: NutritionItem[];
}

/**
 * Lista de alimentos identificados em uma refeição.
 */
export function ParsedItemsList({ items }: ParsedItemsListProps) {
  if (items.length === 0) {
    return <p className="text-slate-500 text-sm">Nenhum item identificado ainda.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={`${item.name}-${i}`}
          className="glass p-3 flex items-center justify-between"
        >
          <div>
            <span className="font-medium">{item.name}</span>
            <span className="text-xs text-slate-400 ml-2">{item.quantityDescription}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{item.calories} kcal</span>
            <ConfidenceBadge confidence={item.confidence} />
          </div>
        </li>
      ))}
    </ul>
  );
}
