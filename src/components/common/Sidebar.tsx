import React from 'react';
import { Play, Layers, Sliders, CheckCircle2, XCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';

export const Sidebar: React.FC = () => {
  const activeModule = useUIStore((state) => state.activeModule);
  const {
    automaton,
    testInput,
    setTestInput,
    runSimulation,
    executionSteps,
    currentStepIndex,
    setStepIndex,
    validationErrors,
  } = useAutomataStore(
    useShallow((state) => ({
      automaton: state.automaton,
      testInput: state.testInput,
      setTestInput: state.setTestInput,
      runSimulation: state.runSimulation,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
      setStepIndex: state.setStepIndex,
      validationErrors: state.validationErrors,
    }))
  );

  const currentStep = executionSteps[currentStepIndex] || {
    stepIndex: 0,
    currentStateId: automaton.startStateId || 'None',
    currentSymbol: null,
    consumedInput: '',
    remainingInput: testInput,
    status: 'PENDING',
    description: 'Ready to evaluate.'
  };

  const hasValidationErrors = validationErrors.length > 0;

  return (
    <aside
      className="glass-sidebar"
      style={{
        width: '340px',
        height: 'calc(100vh - 60px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto'
      }}
    >
      {/* Module Title & Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeModule} Configuration
          </h2>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-blue)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600
          }}
        >
          {automaton.type}
        </span>
      </div>

      {/* Preset Name */}
      <div className="glass-panel" style={{ padding: '12px 14px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          Automaton Name
        </label>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {automaton.name}
        </div>
      </div>

      {/* Real-Time Machine Validation Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '14px',
          borderColor: hasValidationErrors ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)',
          background: hasValidationErrors ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {hasValidationErrors ? (
              <AlertTriangle size={16} color="var(--accent-amber)" />
            ) : (
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
            )}
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
              {hasValidationErrors ? 'Validation Issues' : 'Machine Valid'}
            </h3>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: hasValidationErrors ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: hasValidationErrors ? 'var(--accent-amber)' : 'var(--accent-emerald)'
            }}
          >
            {hasValidationErrors ? `${validationErrors.length} Warning(s)` : 'DFA Ready'}
          </span>
        </div>

        {hasValidationErrors ? (
          <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '11px', color: 'var(--accent-amber)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Automaton definition is valid and complete. Ready for string simulation.
          </p>
        )}
      </div>

      {/* Input String Testing Panel */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="test-input-field" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Test Input String
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="test-input-field"
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            disabled={hasValidationErrors}
            placeholder="e.g. 10010"
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              outline: 'none',
              opacity: hasValidationErrors ? 0.5 : 1
            }}
          />
          <button
            className="btn-primary"
            onClick={runSimulation}
            disabled={hasValidationErrors}
            style={{ padding: '8px 12px', opacity: hasValidationErrors ? 0.5 : 1, cursor: hasValidationErrors ? 'not-allowed' : 'pointer' }}
            title={hasValidationErrors ? 'Fix validation errors first' : 'Run Simulation'}
          >
            <Play size={14} />
          </button>
        </div>
      </div>

      {/* Time-Travel Step Snapshot Inspector */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Step Snapshot</h3>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background:
                currentStep.status === 'ACCEPTED'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : currentStep.status === 'REJECTED'
                  ? 'rgba(244, 63, 94, 0.2)'
                  : 'rgba(56, 189, 248, 0.2)',
              color:
                currentStep.status === 'ACCEPTED'
                  ? 'var(--accent-emerald)'
                  : currentStep.status === 'REJECTED'
                  ? 'var(--accent-rose)'
                  : 'var(--accent-blue)'
            }}
          >
            {currentStep.status}
          </span>
        </div>

        {/* Current State & Symbol metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Active State</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '14px' }}>
              {currentStep.currentStateId}
            </span>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Current Symbol</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)', fontSize: '14px' }}>
              {currentStep.currentSymbol !== null ? `'${currentStep.currentSymbol}'` : 'None'}
            </span>
          </div>
        </div>

        {/* Input Tape Visualization */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Input Tape Breakdown</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{currentStep.consumedInput}</span>
            {currentStep.currentSymbol && (
              <span style={{ background: 'var(--accent-purple)', color: '#fff', padding: '0 4px', borderRadius: '3px', fontWeight: 700 }}>
                {currentStep.currentSymbol}
              </span>
            )}
            <span style={{ color: 'var(--text-secondary)' }}>
              {currentStep.remainingInput}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          {currentStep.description}
        </p>
      </div>

      {/* Step Timeline Selector List */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} color="var(--accent-blue)" />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Execution Trace ({executionSteps.length} steps)</span>
        </div>

        <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {executionSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setStepIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '4px',
                border: idx === currentStepIndex ? '1px solid var(--accent-blue)' : '1px solid transparent',
                background: idx === currentStepIndex ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.3)',
                color: idx === currentStepIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>Step {step.stepIndex}: {step.currentStateId}</span>
              {step.status === 'ACCEPTED' ? (
                <CheckCircle2 size={12} color="var(--accent-emerald)" />
              ) : step.status === 'REJECTED' ? (
                <XCircle size={12} color="var(--accent-rose)" />
              ) : (
                <ArrowRight size={12} color="var(--text-muted)" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CRUCIAL: Google AdSense Verification Placeholder Slot */}
      <div id="adsense-slot-sidebar" style={{ marginTop: 'auto', minHeight: '50px', border: '1px dashed var(--border-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Google AdSense container reserved slot */}
      </div>
    </aside>
  );
};
