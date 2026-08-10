import React, { useEffect } from 'react';
import { Network, Cpu, Binary } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAutomataStore, defaultTM } from '../../store/useAutomataStore';
import DFACanvas from './DFACanvas';
import CompilerEditor from './CompilerEditor';
import TuringMachineView from './TuringMachineView';
import RegexPanel from './RegexPanel';
import CFGViewer from './CFGViewer';
import LandingPage from '../common/LandingPage';
import { loadStateFromURL } from '../../utils/urlState';

export const CanvasViewport: React.FC = () => {
  const { activeModule } = useUIStore();
  const { automaton, setAutomaton } = useAutomataStore();

  useEffect(() => {
    loadStateFromURL();
  }, []);

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
                    setAutomaton({
                      id: 'dfa-even-zeros',
                      name: 'DFA - Binary Strings with Even Zeros',
                      type: 'DFA',
                      alphabet: ['0', '1'],
                      startStateId: 'q0',
                      acceptStateIds: ['q0'],
                      states: [
                        { id: 'q0', label: 'q0', isStart: true, isAccept: true, x: 150, y: 200 },
                        { id: 'q1', label: 'q1', isStart: false, isAccept: false, x: 450, y: 200 },
                      ],
                      transitions: [
                        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
                        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
                        { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
                        { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
                      ],
                    });
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

            {activeModule === 'REGEX' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-purple)' }}>
                <Binary size={14} /> Regex & Thompson Construction Enabled
              </div>
            )}
          </div>

          {/* Regex Compiler Input Panel */}
          {showRegexPanel && automaton.type !== 'TM' && <RegexPanel />}

          {/* Active Machine Viewport */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {automaton.type === 'TM' ? <TuringMachineView /> : <DFACanvas />}
          </div>
        </div>
      ) : activeModule === 'GRAMMAR' ? (
        <CFGViewer />
      ) : activeModule === 'COMPILER_AST' ? (
        <CompilerEditor />
      ) : (
        <LandingPage />
      )}
    </main>
  );
};

export default CanvasViewport;
