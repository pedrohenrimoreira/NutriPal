/**
 * screens/JournalScreen.tsx – Tela principal do diário.
 *
 * Compõe a DailyView e a barra de navegação inferior.
 *
 * TODO: implementar navegação e integração com uiStore.
 */

import { DailyView } from '../components/journal/DailyView';

/**
 * Screen do diário nutricional (tela principal do app).
 */
export function JournalScreen() {
  return (
    <main className="max-w-lg mx-auto">
      <header className="p-4 text-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
          🔍 NutriLens
        </h1>
      </header>
      <DailyView />
    </main>
  );
}
