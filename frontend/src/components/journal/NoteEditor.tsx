/**
 * components/journal/NoteEditor.tsx – Textarea do diário nutricional.
 *
 * Permite que o usuário digite texto livre (ex.: "almoço: arroz, feijão, bife").
 * Ao confirmar, envia para o nutritionRouter processar.
 *
 * TODO: implementar auto-resize, debounce, e botão de envio.
 */

import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';

/**
 * Editor de texto para entrada de refeição.
 */
export function NoteEditor() {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    // TODO: chamar useNutrition().processText(text)
    console.log('TODO: submit text for parsing:', text);
  };

  return (
    <GlassCard>
      <textarea
        className="w-full bg-transparent resize-none outline-none text-white placeholder-slate-500 min-h-[80px]"
        placeholder="O que você comeu? (ex: almoço: arroz, feijão, bife grelhado, salada)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
        >
          Analisar
        </button>
      </div>
    </GlassCard>
  );
}
