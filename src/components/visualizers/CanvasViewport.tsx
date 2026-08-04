import React from 'react';
import { useAutomataStore } from '../../store/useAutomataStore';
import { useUIStore } from '../../store/useUIStore';

export const CanvasViewport: React.FC = () => {
  const { automaton, testInput } = useAutomataStore();
  const { activeModule } = useUIStore();

  return (
    <main
      id="main-viewport-container"
      style={{
        flex: 1,
        height: 'calc(100vh - 60px)',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(9, 13, 22, 0.9) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Canvas Background Grid Pattern */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.15,
            pointerEvents: 'none'
          }}
        >
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* Center Canvas Workspace Info */}
        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '500px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--accent-blue)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Active Engine: {activeModule}
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            {automaton.name}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            React Flow, D3, Zustand, Immer, and Monaco Editor have been initialized successfully. Ready for step-by-step state machine & AST graph renderings.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Input Tape</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--accent-blue)', fontWeight: 700 }}>{testInput || 'EMPTY'}</span>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Start State</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--accent-purple)', fontWeight: 700 }}>{automaton.startStateId}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
