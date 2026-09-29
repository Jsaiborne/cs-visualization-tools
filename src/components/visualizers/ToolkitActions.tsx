import React, { Suspense, lazy, useState } from 'react';
import { Shuffle, Minimize2, GitCompare } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import { useToolkitStore } from '../../store/useToolkitStore';
import { nfaToDfa } from '../../core/automata/subsetConstruction';
import { minimizeDfa } from '../../core/automata/minimize';

const CompareDialog = lazy(() => import('./CompareDialog'));

const buttonStyle = (enabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '4px',
  border: '1px solid var(--border-subtle)',
  fontSize: '11px',
  background: 'rgba(30, 41, 59, 0.6)',
  color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
  cursor: enabled ? 'pointer' : 'not-allowed',
  opacity: enabled ? 1 : 0.5,
});

/** Machine-level tools in the canvas sub-header: NFA → DFA, minimize, compare languages. */
export const ToolkitActions: React.FC = () => {
  const { automaton, setAutomaton } = useAutomataStore(
    useShallow((state) => ({ automaton: state.automaton, setAutomaton: state.setAutomaton }))
  );
  const setConstruction = useToolkitStore((state) => state.setConstruction);
  const [comparing, setComparing] = useState(false);

  const canConvert = automaton.type === 'NFA' && automaton.states.length > 0;
  const canMinimize = automaton.type === 'DFA' && automaton.states.some((s) => s.id === automaton.startStateId);

  const handleConvert = () => {
    if (automaton.type !== 'NFA') return;
    const result = nfaToDfa(automaton);
    setAutomaton(result.dfa);
    setConstruction({ kind: 'subset', result, step: 1 });
  };

  const handleMinimize = () => {
    if (automaton.type !== 'DFA') return;
    const result = minimizeDfa(automaton);
    setConstruction({
      kind: 'minimize',
      result,
      sourceId: automaton.id,
      labels: Object.fromEntries(automaton.states.map((s) => [s.id, s.label])),
      step: 0,
      applied: false,
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '2px' }}>Tools:</span>
      <button
        onClick={handleConvert}
        disabled={!canConvert}
        title={canConvert ? 'Convert this NFA to a DFA, step by step' : 'Available for NFAs (e.g. from a regex)'}
        style={buttonStyle(canConvert)}
      >
        <Shuffle size={12} /> NFA → DFA
      </button>
      <button
        onClick={handleMinimize}
        disabled={!canMinimize}
        title={canMinimize ? 'Merge indistinguishable states, round by round' : 'Available for DFAs'}
        style={buttonStyle(canMinimize)}
      >
        <Minimize2 size={12} /> Minimize
      </button>
      <button onClick={() => setComparing(true)} title="Check whether two languages are equal" style={buttonStyle(true)}>
        <GitCompare size={12} /> Compare…
      </button>
      <Suspense fallback={null}>{comparing && <CompareDialog onClose={() => setComparing(false)} />}</Suspense>
    </div>
  );
};

export default ToolkitActions;
