import React from 'react';
import {
  Layers,
  Table,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useGrammarStore, PRESET_GRAMMARS } from '../../store/useGrammarStore';
import { END_MARKER } from '../../types/cfg';

export const CFGViewer: React.FC = () => {
  const {
    grammarText,
    testInput,
    grammar,
    firstSets,
    followSets,
    ll1Table,
    executionSteps,
    currentStepIndex,
    parseError,
    setGrammarText,
    setTestInput,
    loadPreset,
  } = useGrammarStore();

  const currentStep = executionSteps[currentStepIndex] || null;

  // Active lookup cell during simulation step
  const activeCell = currentStep?.highlightCell || null;

  // Columns for 2D LL(1) Table
  const tableColumns = [...grammar.terminals, END_MARKER];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Control Toolbar */}
      <div
        style={{
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Presets:
          </span>
          {PRESET_GRAMMARS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(30, 41, 59, 0.8)',
              }}
            >
              <BookOpen size={13} color="var(--accent-purple)" />
              {preset.name}
            </button>
          ))}
        </div>

        {/* Test String Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '480px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Input Tape:
          </span>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. id + id * id"
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Multi-Pane Content Area */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr 280px',
          gap: '12px',
          padding: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Left Column: Grammar Input & Sets */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Grammar Text Editor Box */}
          <div
            className="glass-panel"
            style={{
              flex: '1 1 50%',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="var(--accent-cyan)" /> Context-Free Grammar
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>S -&gt; A B | ε</span>
            </div>

            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder="E -> T E'&#10;E' -> + T E' | ε"
              rows={8}
              style={{
                flex: 1,
                width: '100%',
                background: 'rgba(10, 15, 30, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
              }}
            />

            {parseError && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#fda4af',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={14} /> {parseError}
              </div>
            )}
          </div>

          {/* FIRST & FOLLOW Sets Display */}
          <div
            className="glass-panel"
            style={{
              flex: '1 1 50%',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              overflow: 'auto',
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-purple)' }}>
              FIRST & FOLLOW Sets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {grammar.nonTerminals.map((nt) => {
                const first = firstSets[nt] || [];
                const follow = followSets[nt] || [];

                return (
                  <div
                    key={nt}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                      Non-Terminal: <span style={{ fontFamily: 'var(--font-mono)' }}>{nt}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '50px' }}>FIRST:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {first.map((s) => (
                          <span
                            key={s}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '50px' }}>FOLLOW:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {follow.map((s) => (
                          <span
                            key={s}
                            style={{
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              color: '#c084fc',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: 2D LL(1) Parsing Table */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={16} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                2D LL(1) Parsing Table
              </h3>
            </div>

            {ll1Table.conflicts.length > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  color: '#fda4af',
                  background: 'rgba(244, 63, 94, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertTriangle size={12} /> {ll1Table.conflicts.length} Conflict(s) (Not LL(1))
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  color: '#4ade80',
                  background: 'rgba(74, 222, 128, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} /> LL(1) Deterministic Grammar
              </span>
            )}
          </div>

          {/* Table Container */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              background: 'rgba(10, 15, 30, 0.6)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Non-Terminal \ Terminal
                  </th>
                  {tableColumns.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: col === END_MARKER ? 'var(--accent-purple)' : '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grammar.nonTerminals.map((nt) => (
                  <tr
                    key={nt}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px',
                        fontWeight: 700,
                        color: '#38bdf8',
                        textAlign: 'center',
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRight: '1px solid var(--border-subtle)',
                      }}
                    >
                      {nt}
                    </td>
                    {tableColumns.map((col) => {
                      const rule = ll1Table.grid[nt]?.[col];
                      const isHighlighted = activeCell?.nonTerminal === nt && activeCell?.terminal === col;
                      const hasConflict = ll1Table.conflicts.some(
                        (c) => c.nonTerminal === nt && c.terminal === col
                      );

                      return (
                        <td
                          key={col}
                          style={{
                            padding: '8px',
                            textAlign: 'center',
                            transition: 'all 200ms ease',
                            background: isHighlighted
                              ? 'rgba(56, 189, 248, 0.25)'
                              : hasConflict
                              ? 'rgba(244, 63, 94, 0.2)'
                              : 'transparent',
                            border: isHighlighted
                              ? '2px solid #38bdf8'
                              : hasConflict
                              ? '1px solid rgba(244, 63, 94, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.03)',
                            boxShadow: isHighlighted ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
                          }}
                        >
                          {rule ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rule.lhs} &rarr;</span>
                              <span style={{ color: isHighlighted ? '#ffffff' : '#e2e8f0', fontWeight: isHighlighted ? 700 : 500 }}>
                                {rule.rhs.join(' ')}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Trace Banner */}
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Action Taken:</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color:
                    currentStep?.status === 'ACCEPT'
                      ? '#4ade80'
                      : currentStep?.status === 'ERROR'
                      ? '#fda4af'
                      : currentStep?.status === 'PREDICT'
                      ? '#38bdf8'
                      : '#c084fc',
                  fontWeight: 600,
                }}
              >
                {currentStep ? currentStep.actionTaken : 'Ready for simulation'}
              </span>
            </div>
            {currentStep && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Step {currentStepIndex + 1} of {executionSteps.length}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Animated Pushdown Stack Visualizer */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
              Pushdown Stack
            </h3>
          </div>

          {/* Tape Stream Header */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px',
              fontSize: '11px',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Remaining Input Stream:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontFamily: 'var(--font-mono)' }}>
              {currentStep ? (
                currentStep.remainingInput.map((token, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: idx === 0 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: idx === 0 ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: idx === 0 ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: idx === 0 ? 700 : 400,
                    }}
                  >
                    {token}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No input</span>
              )}
            </div>
          </div>

          {/* Stack Container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: '6px',
              padding: '12px',
              background: 'rgba(10, 15, 30, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              overflowY: 'auto',
            }}
          >
            {currentStep?.stackState ? (
              currentStep.stackState.map((symbol, idx) => {
                const isTop = idx === currentStep.stackState.length - 1;
                const isNonTerminal = grammar.nonTerminals.includes(symbol);

                return (
                  <div
                    key={`${idx}-${symbol}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: isTop
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(168, 85, 247, 0.3))'
                        : isNonTerminal
                        ? 'rgba(30, 41, 59, 0.7)'
                        : 'rgba(15, 23, 42, 0.5)',
                      border: isTop
                        ? '1px solid #38bdf8'
                        : isNonTerminal
                        ? '1px solid rgba(56, 189, 248, 0.3)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isTop ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <span style={{ fontWeight: isTop ? 700 : 500, color: isTop ? '#ffffff' : isNonTerminal ? '#38bdf8' : '#e2e8f0' }}>
                      {symbol}
                    </span>
                    {isTop && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: '#38bdf8',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        TOP <ArrowRight size={10} />
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '12px' }}>
                Stack empty
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CFGViewer;
