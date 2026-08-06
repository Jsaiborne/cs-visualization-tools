import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import DFACanvas from './DFACanvas';
import CompilerEditor from './CompilerEditor';

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
      ) : activeModule === 'COMPILER_AST' ? (
        <CompilerEditor />
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
            Switch to <strong>Finite Automata & TM</strong> for graph simulation or <strong>Compiler AST & IR</strong> for source code lexical analysis.
          </p>
        </div>
      )}
    </main>
  );
};
