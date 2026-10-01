import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  Layers,
  Table,
  AlertTriangle,
  CheckCircle2,
  Zap,
  GitBranch,
  Wand2,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useGrammarStore, PRESET_GRAMMARS } from '../../store/useGrammarStore';
import { END_MARKER } from '../../types/cfg';
import { findLeftRecursion, findCommonPrefixes } from '../../core/compiler/grammarTransforms';
import ParseTreeView from './ParseTreeView';
import type { GrammarTransform } from './GrammarTransformDialog';

const GrammarTransformDialog = lazy(() => import('./GrammarTransformDialog'));

const smallButton: React.CSSProperties = {
  display: 'flex',
  whiteSpace: 'nowrap',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  fontSize: '11px',
  borderRadius: '5px',
  border: '1px solid var(--border)',
  background: 'var(--surface-3)',
  color: 'var(--text)',
  cursor: 'pointer',
};


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
    parseTree,
    setGrammarText,
    setTestInput,
    loadPreset,
  } = useGrammarStore(
    useShallow((state) => ({
      grammarText: state.grammarText,
      testInput: state.testInput,
      grammar: state.grammar,
      firstSets: state.firstSets,
      followSets: state.followSets,
      ll1Table: state.ll1Table,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
      parseError: state.parseError,
      parseTree: state.parseTree,
      setGrammarText: state.setGrammarText,
      setTestInput: state.setTestInput,
      loadPreset: state.loadPreset,
    }))
  );

  const currentStep = executionSteps[currentStepIndex] || null;
  const [centerTab, setCenterTab] = useState<'table' | 'tree'>('table');
  const [transform, setTransform] = useState<GrammarTransform | null>(null);
  const treeRoots = useMemo(() => (parseTree.root ? [parseTree.root] : []), [parseTree]);

  // Why the grammar isn't LL(1), when the cause is one the transforms can fix
  const leftRecursive = useMemo(() => findLeftRecursion(grammar), [grammar]);
  const commonPrefixes = useMemo(() => findCommonPrefixes(grammar), [grammar]);

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
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Control Toolbar */}
      <div
        style={{
          padding: '10px 20px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Presets</span>
          {PRESET_GRAMMARS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="preset"
              aria-pressed={grammarText === preset.grammarText}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Test String Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '480px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Input</span>
          <input
            type="text"
            className="input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. id + id * id"
            aria-label="Input tape"
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
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
            className="panel"
            style={{
              flex: '1 1 50%',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Zap size={14} color="var(--text-muted)" /> Context-Free Grammar
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setTransform('left-recursion')} title="Remove left recursion, step by step" style={smallButton}>
                  <Wand2 size={11} /> Left recursion
                </button>
                <button onClick={() => setTransform('left-factor')} title="Factor out common prefixes, step by step" style={smallButton}>
                  <Wand2 size={11} /> Left-factor
                </button>
              </div>
            </div>

            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder="E -> T E'&#10;E' -> + T E' | ε"
              rows={8}
              style={{
                flex: 1,
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '10px',
                color: 'var(--text)',
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
                  background: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
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
            className="panel"
            style={{
              flex: '1 1 50%',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              overflow: 'auto',
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>FIRST & FOLLOW Sets</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {grammar.nonTerminals.map((nt) => {
                const first = firstSets[nt] || [];
                const follow = followSets[nt] || [];

                return (
                  <div
                    key={nt}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--cat-2)', marginBottom: '4px' }}>{nt}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', width: '50px' }}>FIRST:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {first.map((s) => (
                          <span
                            key={s}
                            style={{
                              background: 'var(--accent-subtle)',
                              border: '1px solid var(--accent-border)',
                              color: 'var(--accent)',
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
                              background: 'var(--cat-2-subtle)',
                              border: '1px solid var(--cat-2-border)',
                              color: 'var(--cat-2)',
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
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div role="tablist" className="tabs">
              <button role="tab" aria-selected={centerTab === 'table'} onClick={() => setCenterTab('table')} className="tab">
                <Table size={14} /> LL(1) Table
              </button>
              <button role="tab" aria-selected={centerTab === 'tree'} onClick={() => setCenterTab('tree')} className="tab">
                <GitBranch size={14} /> Parse Tree
              </button>
            </div>

            {ll1Table.conflicts.length > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--danger)',
                  background: 'var(--danger-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-md)',
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
                  color: 'var(--success)',
                  background: 'var(--success-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-md)',
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

          {ll1Table.conflicts.length > 0 && (leftRecursive.length > 0 || commonPrefixes.length > 0) && (
            <div
              style={{
                marginBottom: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                background: 'var(--warning-subtle)',
                border: '1px solid var(--warning-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {leftRecursive.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>
                    <strong>{leftRecursive.join(', ')}</strong> {leftRecursive.length === 1 ? 'is' : 'are'} left-recursive, which LL(1) can't handle.
                  </span>
                  <button onClick={() => setTransform('left-recursion')} style={smallButton}>
                    <Wand2 size={11} /> Remove left recursion
                  </button>
                </div>
              )}
              {commonPrefixes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>
                    <strong>{commonPrefixes.join(', ')}</strong> {commonPrefixes.length === 1 ? 'has' : 'have'} alternatives starting with the same symbol.
                  </span>
                  <button onClick={() => setTransform('left-factor')} style={smallButton}>
                    <Wand2 size={11} /> Left-factor
                  </button>
                </div>
              )}
            </div>
          )}

          {centerTab === 'tree' ? (
            <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <ParseTreeView
                roots={treeRoots}
                step={currentStepIndex}
                activeNodeId={parseTree.activeNodeByStep[currentStepIndex]}
                title="LL(1) Parse Tree (top-down)"
                emptyMessage="Enter a grammar to build a parse tree."
              />
            </div>
          ) : (
          /* Table Container */
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg)',
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
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Non-Terminal \ Terminal
                  </th>
                  {tableColumns.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: col === END_MARKER ? 'var(--cat-2)' : 'var(--accent)',
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
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        textAlign: 'center',
                        background: 'var(--surface-2)',
                        borderRight: '1px solid var(--border)',
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
                              ? 'var(--accent-subtle)'
                              : hasConflict
                              ? 'var(--danger-subtle)'
                              : 'transparent',
                            border: isHighlighted
                              ? '2px solid var(--accent)'
                              : hasConflict
                              ? '1px solid var(--danger-border)'
                              : '1px solid var(--border)',
                          }}
                        >
                          {rule ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rule.lhs} &rarr;</span>
                              <span style={{ color: isHighlighted ? 'var(--text)' : 'var(--text)', fontWeight: isHighlighted ? 700 : 500 }}>
                                {rule.rhs.join(' ')}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-faint)' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Action Trace Banner */}
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
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
                      ? 'var(--success)'
                      : currentStep?.status === 'ERROR'
                      ? 'var(--danger)'
                      : currentStep?.status === 'PREDICT'
                      ? 'var(--accent)'
                      : 'var(--cat-2)',
                  fontWeight: 600,
                }}
              >
                {currentStep ? currentStep.actionTaken : 'Ready for simulation'}
              </span>
            </div>
            {currentStep && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {currentStepIndex + 1} of {executionSteps.length}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Animated Pushdown Stack Visualizer */}
        <div
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers size={16} color="var(--text-muted)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
              Pushdown Stack
            </h3>
          </div>

          {/* Tape Stream Header */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
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
                      background: idx === 0 ? 'var(--accent-subtle)' : 'transparent',
                      border: `1px solid ${idx === 0 ? 'var(--accent)' : 'var(--border)'}`,
                      color: idx === 0 ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: idx === 0 ? 600 : 400,
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
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
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
                      background: isTop ? 'var(--accent-subtle)' : 'var(--surface)',
                      border: `1px solid ${isTop ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <span style={{ fontWeight: isTop ? 600 : 500, color: isNonTerminal ? 'var(--cat-2)' : 'var(--text)' }}>
                      {symbol}
                    </span>
                    {isTop && (
                      <span style={{ fontSize: '11px', color: 'var(--accent)' }}>top</span>
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
      <Suspense fallback={null}>
        {transform && <GrammarTransformDialog transform={transform} onClose={() => setTransform(null)} />}
      </Suspense>
    </div>
  );
};

export default CFGViewer;
