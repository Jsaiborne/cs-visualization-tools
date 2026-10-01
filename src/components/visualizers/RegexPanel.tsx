import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import { useUIStore } from '../../store/useUIStore';
import { compileRegexToNFA } from '../../core/automata/regexCompiler';

const presets = [
  { label: 'Ends with 11', regex: '(0|1)*11', sample: '01011' },
  { label: 'Ends with abb', regex: '(a|b)*abb', sample: 'ababb' },
  { label: 'Starts a, Ends b', regex: 'a(a|b)*b', sample: 'abb' },
  { label: 'Even pairs', regex: '(00|11)*', sample: '001100' },
];

export const RegexPanel: React.FC = () => {
  const {
    setAutomaton,
    setTestInput,
    loadedRegex,
    testInput,
  } = useAutomataStore(
    useShallow((state) => ({
      setAutomaton: state.setAutomaton,
      setTestInput: state.setTestInput,
      loadedRegex: state.automaton.type !== 'TM' ? state.automaton.regex : undefined,
      testInput: state.testInput,
    }))
  );
  const isRegexModule = useUIStore((state) => state.activeModule === 'REGEX');

  // Start from the regex already on the canvas (e.g. from a share link), else the first preset
  const [regexInput, setRegexInput] = useState<string>(loadedRegex ?? presets[0].regex);
  const [sampleString, setSampleString] = useState<string>(loadedRegex !== undefined ? testInput : presets[0].sample);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = (rInput = regexInput, sInput = sampleString) => {
    try {
      setErrorMsg(null);
      const nfaConfig = compileRegexToNFA(rInput);
      setTestInput(sInput);
      setAutomaton(nfaConfig);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  // Opening the Regex module with some other machine on the canvas (the default DFA, a hand-built
  // automaton) would show a stale graph, so compile the regex in the input box right away
  const needsGenerate = isRegexModule && loadedRegex === undefined;
  useEffect(() => {
    if (needsGenerate) handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compile once per stale machine, with the current inputs
  }, [needsGenerate]);

  // Keep the input box in sync when a different regex NFA is loaded elsewhere (share link, history)
  useEffect(() => {
    if (loadedRegex !== undefined) setRegexInput(loadedRegex);
  }, [loadedRegex]);

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setRegexInput(preset.regex);
    setSampleString(preset.sample);
    handleGenerate(preset.regex, preset.sample);
  };

  return (
    <div
      style={{
        padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Regex
          <input
            type="text"
            className="input"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
            placeholder="e.g. (a|b)*abb"
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '210px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Test
          <input
            type="text"
            className="input"
            value={sampleString}
            onChange={(e) => setSampleString(e.target.value)}
            placeholder="e.g. 01011"
            style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          />
        </label>
        <button className="btn-primary" type="submit">
          Generate NFA
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '2px' }}>Presets</span>
          {presets.map((p) => (
            <button key={p.label} type="button" className="preset" aria-pressed={regexInput === p.regex} onClick={() => handleSelectPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Supports union (|), Kleene star (*), one-or-more (+), optional (?), concatenation, and parentheses grouping ()
        </span>
      </div>

      {errorMsg && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--danger)' }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
    </div>
  );
};

export default RegexPanel;
