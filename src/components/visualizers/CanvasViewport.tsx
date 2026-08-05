import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import DFACanvas from './DFACanvas';

export const CanvasViewport: React.FC = () => {
  const { activeModule } = useUIStore();

  return (
    <main
      id="main-viewport-container"
      style={{
        flex: 1,
        height: 'calc(100vh - 60px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {activeModule === 'AUTOMATA' ? (
        <DFACanvas />
      ) : (
        <div
          className="glass-panel"
          style={{
            margin: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: 'var(--accent-purple)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Module Ready
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>
            {activeModule} Visualizer Workspace
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '13px', lineHeight: 1.5 }}>
            Switch to the <strong>Finite Automata & TM</strong> tab to view interactive state machine graph simulations using React Flow and time-travel playback controls.
          </p>
        </div>
      )}
    </main>
  );
};
