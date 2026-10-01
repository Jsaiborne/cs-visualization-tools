import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore, defaultTM, binaryIncrementerTM } from '../../store/useAutomataStore';
import { TuringMachineTape } from './TuringMachineTape';
import { TuringMachineTable } from './TuringMachineTable';
import { ExportMenu } from './ExportMenu';

export const TuringMachineView: React.FC = () => {
  const {
    automaton,
    setAutomaton,
    testInput,
    setTestInput,
    executionSteps,
    currentStepIndex,
    runSimulation,
  } = useAutomataStore(
    useShallow((state) => ({
      automaton: state.automaton,
      setAutomaton: state.setAutomaton,
      testInput: state.testInput,
      setTestInput: state.setTestInput,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
      runSimulation: state.runSimulation,
    }))
  );

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
        padding: '16px',
        gap: '16px',
        // Sections keep their natural height (flexShrink: 0); the view scrolls instead of squeezing them
        overflowY: 'auto',
        background: 'var(--bg)',
      }}
    >
      {/* Machine, presets and input */}
      <div
        className="panel"
        style={{
          flexShrink: 0,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{automaton.name || 'Turing Machine Simulator'}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>One tape, unbounded in both directions</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '2px' }}>Presets</span>
            {presets.map((p) => (
              <button key={p.label} className="preset" aria-pressed={automaton.id === p.config.id} onClick={() => handleSelectPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              className="input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Initial Tape String..."
              aria-label="Initial tape"
              style={{ width: '140px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
            />
            <button className="btn" onClick={runSimulation}>
              <RotateCcw size={13} /> Reload
            </button>
            <ExportMenu automaton={automaton} />
          </div>
        </div>
      </div>

      {/* 1D Tape Visualizer Component */}
      <TuringMachineTape />

      {/* Current step */}
      {currentStep && (
        <div
          className="panel"
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
          }}
        >
          <span className="badge badge-accent" style={{ fontFamily: 'var(--font-mono)' }}>
            Step {currentStepIndex + 1}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{currentStep.description}</span>
        </div>
      )}

      {/* Interactive Transition Rule Table Component */}
      <TuringMachineTable />
    </div>
  );
};

export default TuringMachineView;
