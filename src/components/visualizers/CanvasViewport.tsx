import React, { Suspense, lazy } from 'react';
import { Network, Cpu } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/useUIStore';
import { useAutomataStore, defaultDFA, defaultTM } from '../../store/useAutomataStore';
import LandingPage from '../common/LandingPage';

// Each module's view (and its heavy libraries: React Flow, D3, dagre, Monaco) loads on first use
const DFACanvas = lazy(() => import('./DFACanvas'));
const CompilerEditor = lazy(() => import('./CompilerEditor'));
const TuringMachineView = lazy(() => import('./TuringMachineView'));
const RegexPanel = lazy(() => import('./RegexPanel'));
const CFGViewer = lazy(() => import('./CFGViewer'));
const ToolkitActions = lazy(() => import('./ToolkitActions'));
const ConstructionPanel = lazy(() => import('./ConstructionPanel'));

const ModuleLoading: React.FC = () => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '13px',
    }}
  >
    Loading…
  </div>
);

export const CanvasViewport: React.FC = () => {
  const activeModule = useUIStore(useShallow(state => state.activeModule));
  const { automaton, setAutomaton } = useAutomataStore(useShallow(state => ({
    automaton: state.automaton,
    setAutomaton: state.setAutomaton
  })));

  const showRegexPanel = activeModule === 'REGEX' || automaton.type === 'NFA';

  return (
    <main
      id="main-viewport-container"
      style={{
        flex: 1,
        height: 'calc(100vh - 60px)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<ModuleLoading />}>
      {activeModule === 'HOME' ? (
        <LandingPage />
      ) : activeModule === 'AUTOMATA' || activeModule === 'REGEX' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Sub-Header Machine Mode Switcher Bar */}
          <div
            style={{
              height: '42px',
              padding: '0 20px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
                Machine Mode:
              </span>
              <button
                onClick={() => {
                  if (automaton.type === 'TM') {
                    setAutomaton(defaultDFA);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: automaton.type !== 'TM' ? 600 : 400,
                  background: automaton.type !== 'TM' ? 'var(--accent-purple)' : 'transparent',
                  color: automaton.type !== 'TM' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <Network size={13} /> Automata Canvas (DFA / NFA)
              </button>

              <button
                onClick={() => {
                  if (automaton.type !== 'TM') {
                    setAutomaton(defaultTM);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: automaton.type === 'TM' ? 600 : 400,
                  background: automaton.type === 'TM' ? 'var(--accent-blue)' : 'transparent',
                  color: automaton.type === 'TM' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <Cpu size={13} /> Turing Machine (TM)
              </button>
            </div>

            {automaton.type !== 'TM' && <ToolkitActions />}
          </div>

          {/* Regex Compiler Input Panel */}
          {showRegexPanel && automaton.type !== 'TM' && <RegexPanel />}

          {/* Active Machine Viewport */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {automaton.type === 'TM' ? (
              <TuringMachineView />
            ) : (
              <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <DFACanvas />
                </div>
                <ConstructionPanel />
              </div>
            )}
          </div>
        </div>
      ) : activeModule === 'GRAMMAR' ? (
        <CFGViewer />
      ) : activeModule === 'COMPILER_AST' ? (
        <CompilerEditor />
      ) : (
        <LandingPage />
      )}
      </Suspense>
    </main>
  );
};

export default CanvasViewport;
