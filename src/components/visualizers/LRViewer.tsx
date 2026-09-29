import React, { useMemo, useState } from 'react';
import { Layers, Table, GitBranch, AlertTriangle, CheckCircle2, BookOpen, Zap, Share2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useLRStore, LR_KINDS, LR_PRESETS } from '../../store/useLRStore';
import { LR_KIND_LABELS, actionText, productionText, type LRTable } from '../../core/compiler/lrParser';
import LRStateGraph from './LRStateGraph';
import ParseTreeView from './ParseTreeView';

type CenterTab = 'graph' | 'table' | 'tree';

const panel: React.CSSProperties = { display: 'flex', flexDirection: 'column', padding: '12px', overflow: 'hidden', minHeight: 0 };

const tabButton = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: active ? 700 : 500,
  borderRadius: '6px',
  border: 'none',
  background: active ? 'var(--accent-blue)' : 'transparent',
  color: active ? '#0f172a' : 'var(--text-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const STATUS_COLORS: Record<string, string> = {
  SHIFT: '#38bdf8',
  REDUCE: '#c084fc',
  ACCEPT: '#4ade80',
  ERROR: '#fda4af',
};

const cellStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid var(--border-subtle)',
  borderRight: '1px solid var(--border-subtle)',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const ActionGotoTable: React.FC<{ table: LRTable; activeCell?: { state: number; symbol: string } }> = ({ table, activeCell }) => {
  const conflictCells = new Set(table.conflicts.map((c) => `${c.state}|${c.symbol}`));
  return (
    <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.98)', zIndex: 1 }}>
          <tr>
            <th rowSpan={2} style={{ ...cellStyle, color: 'var(--text-muted)' }}>State</th>
            <th colSpan={table.terminals.length} style={{ ...cellStyle, color: 'var(--accent-blue)' }}>ACTION</th>
            <th colSpan={table.nonTerminals.length} style={{ ...cellStyle, color: 'var(--accent-purple)' }}>GOTO</th>
          </tr>
          <tr>
            {table.terminals.map((t) => (
              <th key={t} style={{ ...cellStyle, color: 'var(--accent-blue)' }}>{t}</th>
            ))}
            {table.nonTerminals.map((nt) => (
              <th key={nt} style={{ ...cellStyle, color: 'var(--accent-purple)' }}>{nt}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.states.map((s) => {
            const rowActive = activeCell?.state === s.id;
            return (
              <tr key={s.id} style={{ background: rowActive ? 'rgba(56, 189, 248, 0.06)' : undefined }}>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', fontWeight: 700 }}>I{s.id}</td>
                {table.terminals.map((t) => {
                  const acts = table.action[s.id]?.[t] ?? [];
                  const isConflict = conflictCells.has(`${s.id}|${t}`);
                  const isActive = rowActive && activeCell?.symbol === t;
                  return (
                    <td
                      key={t}
                      style={{
                        ...cellStyle,
                        background: isConflict ? 'rgba(244, 63, 94, 0.18)' : undefined,
                        outline: isActive ? '2px solid var(--accent-blue)' : undefined,
                        outlineOffset: '-2px',
                        color: acts.some((a) => a.type === 'accept') ? '#4ade80' : acts.length ? 'var(--text-primary)' : 'rgba(255,255,255,0.15)',
                        fontWeight: acts.length ? 700 : 400,
                      }}
                    >
                      {acts.length ? acts.map(actionText).join(' / ') : '·'}
                    </td>
                  );
                })}
                {table.nonTerminals.map((nt) => (
                  <td key={nt} style={{ ...cellStyle, color: 'var(--accent-purple)' }}>
                    {table.goto[s.id]?.[nt] ?? <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** LR parsing module: item sets, ACTION/GOTO tables for four methods, and a shift-reduce trace. */
export const LRViewer: React.FC = () => {
  const {
    grammarText,
    testInput,
    kind,
    table,
    conflictCounts,
    simulation,
    currentStepIndex,
    parseError,
    setGrammarText,
    setTestInput,
    setKind,
    loadPreset,
  } = useLRStore(
    useShallow((state) => ({
      grammarText: state.grammarText,
      testInput: state.testInput,
      kind: state.kind,
      table: state.table,
      conflictCounts: state.conflictCounts,
      simulation: state.simulation,
      currentStepIndex: state.currentStepIndex,
      parseError: state.parseError,
      setGrammarText: state.setGrammarText,
      setTestInput: state.setTestInput,
      setKind: state.setKind,
      loadPreset: state.loadPreset,
    }))
  );
  const [tab, setTab] = useState<CenterTab>('graph');
  const step = simulation.steps[currentStepIndex];
  const preset = LR_PRESETS.find((p) => p.grammarText === grammarText);
  const graphKey = useMemo(() => `${kind}|${grammarText}`, [kind, grammarText]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--bg-dark)' }}>
      {/* Presets & input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '8px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Presets:</span>
          {LR_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id)}
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                gap: '6px',
                borderColor: preset?.id === p.id ? 'var(--accent-blue)' : undefined,
              }}
            >
              <BookOpen size={13} color="var(--accent-purple)" /> {p.name}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', flex: '1 1 260px', maxWidth: '420px' }}>
          Input:
          <input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="id + id * id"
            style={{
              flex: 1,
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </label>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(250px, 300px) minmax(0, 1fr) minmax(220px, 270px)',
          gap: '12px',
          padding: '12px',
          minHeight: 0,
        }}
      >
        {/* Left: grammar, method, productions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
          <div className="glass-panel" style={{ ...panel, flex: '0 0 auto' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Zap size={14} color="var(--accent-cyan)" /> Grammar
            </span>
            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              rows={5}
              aria-label="Grammar"
              style={{
                width: '100%',
                background: 'rgba(10, 15, 30, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '8px',
                color: '#e2e8f0',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />
            {parseError && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#fda4af', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={13} /> {parseError}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ ...panel, flex: '0 0 auto', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Parsing method</span>
            {LR_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${kind === k ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: kind === k ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  color: 'var(--text-primary)',
                  fontWeight: kind === k ? 700 : 500,
                }}
              >
                {LR_KIND_LABELS[k]}
                {conflictCounts[k] === 0 ? (
                  <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <CheckCircle2 size={12} /> no conflicts
                  </span>
                ) : (
                  <span style={{ color: '#fda4af', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <AlertTriangle size={12} /> {conflictCounts[k]} conflict{conflictCounts[k] === 1 ? '' : 's'}
                  </span>
                )}
              </button>
            ))}
            {preset && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{preset.note}</p>
            )}
          </div>

          <div className="glass-panel" style={{ ...panel, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Productions</span>
            <div style={{ overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {table.productions.map((p) => (
                <div
                  key={p.index}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: step?.production === p.index ? 'rgba(192, 132, 252, 0.2)' : undefined,
                    color: p.index === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}
                >
                  <span style={{ color: 'var(--accent-purple)', display: 'inline-block', width: '30px' }}>r{p.index}</span>
                  {productionText(p)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: item sets / table / tree */}
        <div className="glass-panel" style={{ ...panel, gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div role="tablist" style={{ display: 'flex', gap: '4px' }}>
              <button role="tab" aria-selected={tab === 'graph'} onClick={() => setTab('graph')} style={tabButton(tab === 'graph')}>
                <Share2 size={14} /> Item sets ({table.states.length})
              </button>
              <button role="tab" aria-selected={tab === 'table'} onClick={() => setTab('table')} style={tabButton(tab === 'table')}>
                <Table size={14} /> ACTION / GOTO
              </button>
              <button role="tab" aria-selected={tab === 'tree'} onClick={() => setTab('tree')} style={tabButton(tab === 'tree')}>
                <GitBranch size={14} /> Parse Tree
              </button>
            </div>
            {table.conflicts.length > 0 ? (
              <span style={{ fontSize: '11px', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} />
                {table.conflicts.map((c) => `I${c.state} on '${c.symbol}': ${c.kind}`).slice(0, 3).join('; ')}
                {table.conflicts.length > 3 && ` (+${table.conflicts.length - 3} more)`}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> The grammar is {LR_KIND_LABELS[kind]}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: tab === 'table' ? undefined : '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
            {tab === 'graph' && <LRStateGraph key={graphKey} table={table} activeState={step?.cell?.state ?? null} />}
            {tab === 'table' && <ActionGotoTable table={table} activeCell={step?.cell} />}
            {tab === 'tree' && (
              <ParseTreeView
                roots={simulation.roots}
                step={currentStepIndex}
                activeNodeId={simulation.activeNodeByStep[currentStepIndex]}
                title="LR Parse Tree (bottom-up)"
                emptyMessage="Step forward: subtrees appear as tokens are shifted and handles reduced."
              />
            )}
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '12px',
            }}
          >
            <span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Action: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: step ? STATUS_COLORS[step.status] : undefined }}>
                {step?.description ?? 'Enter an input string.'}
              </span>
            </span>
            {step && (
              <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Step {currentStepIndex + 1} of {simulation.steps.length}
              </span>
            )}
          </div>
        </div>

        {/* Right: stack and input */}
        <div className="glass-panel" style={{ ...panel, gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="var(--accent-blue)" /> Parse Stack
          </span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Remaining input</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(step?.remainingInput ?? []).map((tok, i) => (
                <span
                  key={i}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: i === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    color: i === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {tok}
                </span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stack (top first): state · symbol</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...(step?.stack ?? [])].reverse().map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  border: `1px solid ${i === 0 ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                  background: i === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                }}
              >
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>I{entry.state}</span>
                <span style={{ color: entry.symbol && table.nonTerminals.includes(entry.symbol) ? '#d8b4fe' : 'var(--text-primary)' }}>
                  {entry.symbol ?? '⊥'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LRViewer;
