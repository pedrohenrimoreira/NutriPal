import { JournalScreen } from './screens/JournalScreen';

/**
 * Componente raiz do NutriLens.
 *
 * Arquitetura de navegação:
 * - JournalScreen: tela principal (diário do dia)
 * - HistoryScreen: histórico de dias anteriores
 * - SettingsScreen: configurações do app
 *
 * TODO: implementar roteamento (react-router ou navegação simples por estado).
 * Por ora, renderiza apenas o JournalScreen.
 */
function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <JournalScreen />
    </div>
  );
}

export default App;
