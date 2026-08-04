import React from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CanvasViewport } from './components/visualizers/CanvasViewport';

export const App: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        <Sidebar />
        <CanvasViewport />
      </div>
    </div>
  );
};

export default App;
