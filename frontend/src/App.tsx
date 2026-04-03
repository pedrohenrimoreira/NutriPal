import { useState } from 'react';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsSheet } from './components/settings/SettingsSheet';

/**
 * NutriPal - App root.
 */
function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      id="app-root"
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)', minHeight: '100dvh' }}
    >
      <JournalScreen onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
