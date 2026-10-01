import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAutomataStore } from '../../store/useAutomataStore';
import { compileRegexToNFA } from '../../core/automata/regexCompiler';
import { compareAutomata, type EquivalenceResult } from '../../core/automata/equivalence';
import type { DFAConfig, NFAConfig } from '../../types/automata';

type Mode = 'machine' | 'regexes';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: '13px',
  fontFamily: 'var(--font-mono)',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  outline: 'none',
};

const showString = (w: string) => (w === '' ? 'ε (the empty string)' : `"${w}"`);

/** Checks whether two automata/regexes accept the same language and shows a separating string. */
export const CompareDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const automaton = useAutomataStore((state) => state.automaton);
  const setTestInput = useAutomataStore((state) => state.setTestInput);
  const canUseMachine = automaton.type !== 'TM';

  const [mode, setMode] = useState<Mode>(canUseMachine ? 'machine' : 'regexes');
  const [regexA, setRegexA] = useState(automaton.type !== 'TM' && automaton.regex ? automaton.regex : '(a|b)*');
  const [regexB, setRegexB] = useState('(a*b*)*');
  const [result, setResult] = useState<EquivalenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstName = mode === 'machine' ? 'the current machine' : `/${regexA}/`;
  const secondName = `/${regexB}/`;

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const first = mode === 'machine' ? (automaton as DFAConfig | NFAConfig) : compileRegexToNFA(regexA);
      setResult(compareAutomata(first, compileRegexToNFA(regexB)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal title="Compare languages" onClose={onClose} width={480}>
      <form onSubmit={handleCompare} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: canUseMachine ? 1 : 0.5 }}>
            <input type="radio" checked={mode === 'machine'} disabled={!canUseMachine} onChange={() => setMode('machine')} />
            Current machine vs regex
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="radio" checked={mode === 'regexes'} onChange={() => setMode('regexes')} />
            Two regexes
          </label>
        </div>

        {mode === 'machine' ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            First: <strong style={{ color: 'var(--text)' }}>{automaton.name}</strong> ({automaton.type})
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            First regex
            <input value={regexA} onChange={(e) => setRegexA(e.target.value)} style={inputStyle} />
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {mode === 'machine' ? 'Regex' : 'Second regex'}
          <input value={regexB} onChange={(e) => setRegexB(e.target.value)} autoFocus style={inputStyle} />
        </label>

        <button className="btn-primary" type="submit" style={{ alignSelf: 'flex-start', padding: '7px 16px', fontSize: '13px' }}>
          Compare
        </button>

        {error && <div role="status" style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</div>}

        {result && (
          <div
            role="status"
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              lineHeight: 1.5,
              border: `1px solid ${result.equivalent ? 'var(--success-border)' : 'var(--danger-border)'}`,
              background: result.equivalent ? 'var(--success-subtle)' : 'var(--danger-subtle)',
            }}
          >
            {result.equivalent ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <span>Equivalent: both accept exactly the same strings.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <XCircle size={18} color="var(--danger)" />
                  <span>Not equivalent.</span>
                </div>
                <span>
                  Shortest difference: <code style={{ color: 'var(--warning)' }}>{showString(result.counterexample!)}</code> is
                  accepted by <strong>{result.acceptedBy === 'first' ? firstName : secondName}</strong> but not by{' '}
                  <strong>{result.acceptedBy === 'first' ? secondName : firstName}</strong>.
                </span>
                {mode === 'machine' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setTestInput(result.counterexample!);
                      onClose();
                    }}
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px' }}
                  >
                    Run this string on the machine
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CompareDialog;
