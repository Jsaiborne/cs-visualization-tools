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
const LRViewer = lazy(() => import('./LRViewer'));
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
        height: '100%',
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
              height: '40px',
              padding: '0 12px 0 8px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <div className="tabs" role="tablist" aria-label="Machine mode" style={{ alignSelf: 'stretch' }}>
              <button
                role="tab"
                className="tab"
                aria-selected={automaton.type !== 'TM'}
                onClick={() => {
                  if (automaton.type === 'TM') setAutomaton(defaultDFA);
                }}
                style={{ fontSize: '12px' }}
              >
                <Network size={14} /> Automata Canvas (DFA / NFA)
              </button>
              <button
                role="tab"
                className="tab"
                aria-selected={automaton.type === 'TM'}
                onClick={() => {
                  if (automaton.type !== 'TM') setAutomaton(defaultTM);
                }}
                style={{ fontSize: '12px' }}
              >
                <Cpu size={14} /> Turing Machine (TM)
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
      ) : activeModule === 'LR' ? (
        <LRViewer />
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
