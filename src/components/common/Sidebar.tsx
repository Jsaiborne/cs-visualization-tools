import React from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { ExecutionStep } from '../../types/automata';

const sectionStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-muted)',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginBottom: '2px',
};

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

  const currentStep: ExecutionStep = executionSteps[currentStepIndex] || {
    stepIndex: 0,
    currentStateId: automaton.startStateId || 'None',
    currentSymbol: null,
    consumedInput: '',
    remainingInput: testInput,
    status: 'PENDING',
    description: 'Ready to evaluate.'
  };

  const hasValidationErrors = validationErrors.length > 0;

  // DFA/NFA steps split the input around the symbol being read. A Turing machine doesn't consume
  // input, so show its tape split around the head instead.
  const tape = currentStep.tapeState;
  const head = currentStep.tapeHeadIndex;
  const tapeSplit =
    tape && head !== undefined
      ? {
          label: 'Tape (around head)',
          before: tape.slice(0, head).join(''),
          current: tape[head] ?? '',
          after: tape.slice(head + 1).join(''),
        }
      : {
          label: 'Input Tape Breakdown',
          before: currentStep.consumedInput,
          current: currentStep.currentSymbol ?? '',
          after: currentStep.remainingInput,
        };

  const statusBadge =
    currentStep.status === 'ACCEPTED' ? 'badge-success' : currentStep.status === 'REJECTED' ? 'badge-danger' : 'badge-accent';

  return (
    <aside
      className="sidebar"
      style={{
        width: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Machine */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={sectionTitle}>{activeModule === 'REGEX' ? 'Regex' : 'Automaton'}</h2>
          <span className="badge">{automaton.type}</span>
        </div>
        <div>
          <label style={fieldLabel}>Automaton Name</label>
          <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>{automaton.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
          {hasValidationErrors ? (
            <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
          ) : (
            <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '1px' }} />
          )}
          {hasValidationErrors ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                {validationErrors.length} issue{validationErrors.length === 1 ? '' : 's'} to fix
              </span>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              Valid {automaton.type}, ready to run.
            </span>
          )}
        </div>
      </section>

      {/* Input */}
      <section style={sectionStyle}>
        <label htmlFor="test-input-field" style={sectionTitle}>
          Test input
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            id="test-input-field"
            type="text"
            className="input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            disabled={hasValidationErrors}
            placeholder="e.g. 10010"
            style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
          />
          <button
            className="btn-primary"
            onClick={runSimulation}
            disabled={hasValidationErrors}
            style={{ padding: '6px 10px' }}
            title={hasValidationErrors ? 'Fix validation errors first' : 'Run Simulation'}
          >
            <Play size={14} />
          </button>
        </div>
      </section>

      {/* Current step */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={sectionTitle}>Current step</h2>
          <span className={`badge ${statusBadge}`}>{currentStep.status}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <span style={fieldLabel}>Active State</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px', wordBreak: 'break-all' }}>
              {currentStep.currentStateId}
            </span>
          </div>
          <div>
            <span style={fieldLabel}>Current Symbol</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px' }}>
              {currentStep.currentSymbol !== null ? `'${currentStep.currentSymbol}'` : 'None'}
            </span>
          </div>
        </div>
        <div>
          <span style={fieldLabel}>{tapeSplit.label}</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>{tapeSplit.before}</span>
            {tapeSplit.current && (
              <span
                style={{
                  color: 'var(--accent)',
                  borderBottom: '2px solid var(--accent)',
                  padding: '0 2px',
                  fontWeight: 700,
                }}
              >
                {tapeSplit.current}
              </span>
            )}
            <span style={{ color: 'var(--text)' }}>{tapeSplit.after}</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{currentStep.description}</p>
      </section>

      {/* Trace */}
      <section style={{ ...sectionStyle, borderBottom: 'none' }}>
        <h2 style={sectionTitle}>Execution Trace ({executionSteps.length} steps)</h2>
        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {executionSteps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={idx}
                onClick={() => setStepIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  borderLeft: `2px solid ${isCurrent ? 'var(--accent)' : 'transparent'}`,
                  background: isCurrent ? 'var(--surface-2)' : 'transparent',
                  color: isCurrent ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>Step {step.stepIndex}: {step.currentStateId}</span>
                {step.status === 'ACCEPTED' ? (
                  <CheckCircle2 size={12} color="var(--success)" />
                ) : step.status === 'REJECTED' ? (
                  <XCircle size={12} color="var(--danger)" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Reserved for a sponsor/ad slot; renders as nothing until filled */}
      <div id="adsense-slot-sidebar" style={{ marginTop: 'auto' }} />
    </aside>
  );
};
