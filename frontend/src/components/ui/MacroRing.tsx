/**
 * components/ui/MacroRing.tsx – Anel de progresso para macronutrientes.
 *
 * Renderiza um anel SVG circular mostrando o progresso de consumo
 * de um macronutriente (calorias, proteína, carbs, gordura) em relação
 * à meta diária.
 *
 * TODO: implementar SVG circular com stroke-dasharray animado.
 */

interface MacroRingProps {
  /** Nome do macro (ex.: "Calorias"). */
  label: string;
  /** Valor atual consumido. */
  current: number;
  /** Meta diária. */
  goal: number;
  /** Unidade (ex.: "kcal", "g"). */
  unit: string;
  /** Cor do anel (CSS color). */
  color?: string;
}

/**
 * Anel de progresso SVG para macronutrientes.
 * TODO: implementar SVG com animação de preenchimento.
 */
export function MacroRing({ label, current, goal, unit, color = '#22c55e' }: MacroRingProps) {
  const _pct = Math.min((current / goal) * 100, 100);
  void color;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* TODO: SVG ring aqui */}
      <div className="w-16 h-16 rounded-full border-4 border-brand-500/30 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(_pct)}%</span>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium">
        {current}/{goal} {unit}
      </span>
    </div>
  );
}
