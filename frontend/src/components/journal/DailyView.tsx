/**
 * components/journal/DailyView.tsx – Tela principal do diário.
 *
 * Layout:
 * - Header com data e navegação
 * - NoteEditor para entrada de texto
 * - ParsedItemsList com itens identificados
 * - DailySummary flutuante com totais
 *
 * TODO: implementar layout completo com integração dos sub-componentes.
 */

import { GlassCard } from '../ui/GlassCard';
import { NoteEditor } from './NoteEditor';
import { DailySummary } from './DailySummary';

/**
 * Tela principal: visão diária do diário nutricional.
 */
export function DailyView() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header com data */}
      <GlassCard>
        <h2 className="text-lg font-semibold">Hoje</h2>
        {/* TODO: seletor de data, streak badge */}
      </GlassCard>

      {/* Editor de notas */}
      <NoteEditor />

      {/* TODO: <ParsedItemsList /> */}

      {/* Sumário flutuante (fixed bottom) */}
      <DailySummary />
    </div>
  );
}
