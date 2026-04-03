/**
 * components/journal/GoalsPanel.tsx – Expandable goals card (Amy-inspired).
 *
 * Shows a summary bar at bottom when collapsed.
 * Expands to show full goals with progress bars and macro circles.
 */

import type { NutritionTotals } from '../../types/food';

interface GoalsPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  totals: NutritionTotals;
  goals: NutritionTotals;
}

export function GoalsPanel({ isExpanded, onToggle, totals, goals }: GoalsPanelProps) {
  const calPct = goals.calories > 0 ? Math.min((totals.calories / goals.calories) * 100, 100) : 0;

  return (
    <div className="px-4 flex-shrink-0">
      {/* Collapsed: macro summary bar */}
      {!isExpanded && (
        <button
          onClick={onToggle}
          className="w-full glass-interactive px-4 py-3 flex items-center justify-center gap-3 text-sm mb-1"
          id="goals-collapsed-bar"
        >
          <span className="flex items-center gap-1">
            <span>🔥</span>
            <span className="font-semibold">{Math.round(totals.calories)}</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span className="flex items-center gap-1">
            <span style={{ color: 'var(--accent-blue)' }}>C</span>
            <span>{Math.round(totals.carbs_g)}</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span className="flex items-center gap-1">
            <span style={{ color: 'var(--accent-orange)' }}>P</span>
            <span>{Math.round(totals.protein_g)}</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span className="flex items-center gap-1">
            <span style={{ color: 'var(--accent-purple)' }}>F</span>
            <span>{Math.round(totals.fat_g)}</span>
          </span>
        </button>
      )}

      {/* Expanded: full goals card */}
      {isExpanded && (
        <div
          className="glass-elevated p-5 mb-1 animate-scale-in"
          onClick={onToggle}
          id="goals-expanded-card"
        >
          <h3 className="font-semibold text-[15px] mb-4">Goals</h3>

          {/* Calories progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-sm">
                <span>🔥</span>
                <span>Calories</span>
              </span>
              <span className="text-sm text-zinc-400">
                {Math.round(totals.calories)} / {goals.calories}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${calPct}%`,
                  background: 'var(--accent-orange)',
                }}
              />
            </div>
          </div>

          {/* Main macros */}
          <div className="flex justify-center gap-6 mb-4">
            <MacroCircle
              value={Math.round(totals.carbs_g)}
              label="Carbs"
              color="var(--accent-blue)"
            />
            <MacroCircle
              value={Math.round(totals.protein_g)}
              label="Protein"
              color="var(--accent-orange)"
            />
            <MacroCircle
              value={Math.round(totals.fat_g)}
              label="Fat"
              color="var(--accent-purple)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* Mini macro circle component */
function MacroCircle({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="macro-circle"
        style={{ borderColor: value > 0 ? color : undefined }}
      >
        <span className="text-base font-semibold">{value}</span>
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
