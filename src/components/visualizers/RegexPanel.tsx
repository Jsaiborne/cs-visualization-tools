import React, { useEffect, useState } from 'react';
import { Binary, Sparkles, AlertCircle } from 'lucide-react';
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
        padding: '12px 16px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left Title & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
            }}
          >
            <Binary size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Thompson's Regex-to-NFA Compiler
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Supports union (|), Kleene star (*), one-or-more (+), optional (?), concatenation, and parentheses grouping ()
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="var(--accent-purple)" />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background:
                  regexInput === p.regex ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.5)',
                color: regexInput === p.regex ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: regexInput === p.regex ? 600 : 400,
                transition: 'all 150ms ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Regex Input Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Regex:
          </span>
          <input
            type="text"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
            placeholder="e.g. (a|b)*abb"
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(9, 13, 22, 0.9)',
              color: '#ffffff',
            }}
          />
        </div>

        {/* Test String Input Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '180px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Test Input:
          </span>
          <input
            type="text"
            value={sampleString}
            onChange={(e) => setSampleString(e.target.value)}
            placeholder="e.g. 01011"
            style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(9, 13, 22, 0.9)',
              color: '#ffffff',
            }}
          />
        </div>

        {/* Generate Button */}
        <button
          className="btn-primary"
          onClick={() => handleGenerate()}
          style={{ padding: '6px 14px', fontSize: '12px', gap: '6px' }}
        >
          <Sparkles size={14} /> Generate NFA
        </button>
      </div>

      {/* Syntax Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
    </div>
  );
};

export default RegexPanel;
