import React from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CanvasViewport } from './components/visualizers/CanvasViewport';
import { useUIStore } from './store/useUIStore';

export const App: React.FC = () => {
  // The sidebar drives the automata store, so it only belongs next to the automata-based modules;
  // the grammar and compiler views carry their own inputs and step info.
  const showSidebar = useUIStore((state) => state.activeModule === 'AUTOMATA' || state.activeModule === 'REGEX');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        {showSidebar && <Sidebar />}
        <CanvasViewport />
      </div>
    </div>
  );
};

export default App;
