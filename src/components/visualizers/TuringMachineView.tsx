import React from 'react';
import { Cpu, RotateCcw, Sparkles } from 'lucide-react';
import { useAutomataStore, defaultTM, binaryIncrementerTM } from '../../store/useAutomataStore';
import { TuringMachineTape } from './TuringMachineTape';
import { TuringMachineTable } from './TuringMachineTable';

export const TuringMachineView: React.FC = () => {
  const { automaton, setAutomaton, testInput, setTestInput, executionSteps, currentStepIndex, runSimulation } =
    useAutomataStore();

  const currentStep = executionSteps[currentStepIndex];

  const presets = [
    { label: 'Bit Flipper', config: defaultTM, sampleInput: '10010' },
    { label: 'Binary Incrementer (+1)', config: binaryIncrementerTM, sampleInput: '1011' },
  ];

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setAutomaton(preset.config);
    setTestInput(preset.sampleInput);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '20px',
        gap: '20px',
        overflowY: 'auto',
        background: 'var(--bg-dark)',
      }}
    >
      {/* Control Bar: Preset Switcher & Input Loader */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Machine Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
            }}
          >
            <Cpu size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {automaton.name || 'Turing Machine Simulator'}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Turing Machine Engine with 1D Bi-Infinite Memory Tape & Transition Rules
            </span>
          </div>
        </div>

        {/* Input Field & Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--accent-purple)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background:
                    automaton.id === p.config.id
                      ? 'var(--gradient-primary)'
                      : 'rgba(30, 41, 59, 0.5)',
                  color: automaton.id === p.config.id ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: automaton.id === p.config.id ? 600 : 400,
                  transition: 'all 150ms ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Test Input Input Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Initial Tape String..."
              style={{
                width: '140px',
                padding: '5px 10px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
              }}
            />
            <button
              className="btn-primary"
              onClick={runSimulation}
              style={{ padding: '5px 12px', fontSize: '12px', gap: '6px' }}
            >
              <RotateCcw size={13} /> Reload
            </button>
          </div>
        </div>
      </div>

      {/* 1D Tape Visualizer Component */}
      <TuringMachineTape />

      {/* Step Description Banner */}
      {currentStep && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            Step {currentStepIndex + 1}
          </span>
          <span style={{ color: 'var(--text-primary)' }}>{currentStep.description}</span>
        </div>
      )}

      {/* Interactive Transition Rule Table Component */}
      <TuringMachineTable />
    </div>
  );
};

export default TuringMachineView;
