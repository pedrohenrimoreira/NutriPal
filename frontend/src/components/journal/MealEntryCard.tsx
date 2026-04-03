/**
 * components/journal/MealEntryCard.tsx - Card for a logged meal entry.
 *
 * Shows text/image content, parsed items (if available), and calorie total.
 */

import type { MealEntry } from '../../types/food';

interface MealEntryCardProps {
  entry: MealEntry;
}

export function MealEntryCard({ entry }: MealEntryCardProps) {
  const time = new Date(entry.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="glass-interactive p-4" id={`meal-entry-${entry.id}`}>
      {/* Header: time + calories */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{time}</span>
        {entry.parsedResult && (
          <span className="text-sm font-semibold">
            🔥 {Math.round(entry.parsedResult.totals.calories)}
          </span>
        )}
      </div>

      {/* Raw text */}
      <p className="text-[15px] text-white/90 leading-relaxed">{entry.rawText}</p>

      {/* Uploaded image preview */}
      {entry.imageUrl && (
        <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
          <img
            src={entry.imageUrl}
            alt="Meal upload"
            className="w-full h-auto max-h-72 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Parsed items summary */}
      {entry.parsedResult && entry.parsedResult.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
          {entry.parsedResult.items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-400">{item.name}</span>
              <span className="text-zinc-500 text-xs">{item.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {/* Processing indicator */}
      {entry.isDirty && !entry.parsedResult && (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-block w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          Analisando...
        </div>
      )}
    </div>
  );
}
