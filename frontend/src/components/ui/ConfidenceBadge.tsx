/**
 * components/ui/ConfidenceBadge.tsx – Badge de confiança da estimativa.
 *
 * Exibe visualmente se o resultado nutricional é:
 * - "high": dado veio do dataset local (mais preciso)
 * - "medium": estimado por LLM
 * - "low": estimado com grande margem de erro
 */

import type { ConfidenceLevel } from '../../types/food';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

const STYLES: Record<ConfidenceLevel, { label: string; classes: string }> = {
  high: { label: 'Preciso', classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: 'Estimado', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low: { label: 'Aproximado', classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

/**
 * Badge que indica o nível de confiança de uma estimativa nutricional.
 */
export function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  const style = STYLES[confidence];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.classes} ${className}`}
    >
      {style.label}
    </span>
  );
}
