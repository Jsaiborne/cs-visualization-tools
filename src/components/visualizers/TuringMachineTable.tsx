import React, { useState } from 'react';
import { Table, Plus, Trash2, ArrowRight, ArrowLeft, CircleDot } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { TMConfig, TMTransitionRule, TMDirection } from '../../types/automata';

export const TuringMachineTable: React.FC = () => {
  const {
    automaton,
    executionSteps,
    currentStepIndex,
    addTMRule,
    removeTMRule,
  } = useAutomataStore(
    useShallow((state) => ({
      automaton: state.automaton,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
      addTMRule: state.addTMRule,
      removeTMRule: state.removeTMRule,
    }))
  );
  const tm = automaton.type === 'TM' ? (automaton as TMConfig) : null;
  const rules = tm?.transitions || [];

  const currentStep = executionSteps[currentStepIndex];
  const activeRuleId = currentStep?.activeTransitionId;

  // New Rule Form State
  const [fromState, setFromState] = useState('q0');
  const [readSymbol, setReadSymbol] = useState('0');
  const [writeSymbol, setWriteSymbol] = useState('1');
  const [moveDirection, setMoveDirection] = useState<TMDirection>('R');
  const [nextState, setNextState] = useState('q0');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    addTMRule({
      fromState,
      read: readSymbol,
      write: writeSymbol,
      move: moveDirection,
      nextState,
    });
    setShowAddForm(false);
  };

  const getMoveIcon = (dir: TMDirection) => {
    switch (dir) {
      case 'L':
        return <ArrowLeft size={12} color="#38bdf8" />;
      case 'R':
        return <ArrowRight size={12} color="#38bdf8" />;
      case 'N':
        return <CircleDot size={12} color="#a855f7" />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flexShrink: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Transition Rule Table (δ Function)
          </span>
        </div>

        <button
          className="btn-secondary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
        >
          <Plus size={12} /> {showAddForm ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {/* Add New Rule Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddRule}
          style={{
            padding: '12px 16px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>From</label>
            <input
              type="text"
              value={fromState}
              onChange={(e) => setFromState(e.target.value)}
              style={{
                width: '60px',
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Read</label>
            <input
              type="text"
              value={readSymbol}
              onChange={(e) => setReadSymbol(e.target.value)}
              style={{
                width: '40px',
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                textAlign: 'center',
              }}
            />
          </div>

          <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px' }}>→</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Write</label>
            <input
              type="text"
              value={writeSymbol}
              onChange={(e) => setWriteSymbol(e.target.value)}
              style={{
                width: '40px',
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Move</label>
            <select
              value={moveDirection}
              onChange={(e) => setMoveDirection(e.target.value as TMDirection)}
              style={{
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
              }}
            >
              <option value="R">R (Right)</option>
              <option value="L">L (Left)</option>
              <option value="N">N (None)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Next</label>
            <input
              type="text"
              value={nextState}
              onChange={(e) => setNextState(e.target.value)}
              style={{
                width: '70px',
                padding: '4px 6px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '4px 12px', fontSize: '11px', marginTop: '12px' }}
          >
            Save Rule
          </button>
        </form>
      )}

      {/* Rules Table Content */}
      <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '8px 12px', width: '40px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>Current State</th>
              <th style={{ padding: '8px 12px' }}>Read Symbol</th>
              <th style={{ padding: '8px 12px' }}>Action (Write, Move)</th>
              <th style={{ padding: '8px 12px' }}>Next State</th>
              <th style={{ padding: '8px 12px', width: '40px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  No transition rules defined. Add a rule to start.
                </td>
              </tr>
            ) : (
              rules.map((rule: TMTransitionRule, idx: number) => {
                const isActive = activeRuleId === rule.id;

                return (
                  <tr
                    key={rule.id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isActive
                        ? 'rgba(56, 189, 248, 0.15)'
                        : idx % 2 === 0
                        ? 'rgba(15, 23, 42, 0.3)'
                        : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: isActive ? 600 : 400,
                      boxShadow: isActive ? 'inset 4px 0 0 #38bdf8' : 'none',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {/* Index */}
                    <td
                      style={{
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        color: isActive ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '11px',
                      }}
                    >
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>

                    {/* From State */}
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {rule.fromState}
                      </span>
                    </td>

                    {/* Read Symbol */}
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          fontWeight: 700,
                        }}
                      >
                        '{rule.read}'
                      </span>
                    </td>

                    {/* Action: Write & Move */}
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Write</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>'{rule.write}'</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>|</span>
                        <span>Move</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#38bdf8', fontWeight: 700 }}>
                          {getMoveIcon(rule.move)} {rule.move}
                        </span>
                      </div>
                    </td>

                    {/* Next State */}
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(30, 41, 59, 0.6)',
                          border: '1px solid var(--border-subtle)',
                          color: rule.nextState.includes('accept') ? '#34d399' : '#ffffff',
                        }}
                      >
                        {rule.nextState}
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => removeTMRule(rule.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Delete Rule"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TuringMachineTable;
