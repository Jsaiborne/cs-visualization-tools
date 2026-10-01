import React from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsRight, Check } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useToolkitStore, BLOCK_COLORS, type Construction } from '../../store/useToolkitStore';
import { useAutomataStore } from '../../store/useAutomataStore';
import { DEAD_STATE_ID, DEAD_STATE_LABEL } from '../../core/automata/subsetConstruction';

const cell: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  whiteSpace: 'nowrap',
};

const Stepper: React.FC<{ step: number; min: number; max: number; label: string; onChange: (step: number) => void }> = ({
  step,
  min,
  max,
  label,
  onChange,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <button className="btn-secondary" onClick={() => onChange(step - 1)} disabled={step <= min} aria-label="Previous step" style={{ padding: '4px 6px', opacity: step <= min ? 0.4 : 1 }}>
      <ChevronLeft size={14} />
    </button>
    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', minWidth: '96px', textAlign: 'center' }}>
      {label}
    </span>
    <button className="btn-secondary" onClick={() => onChange(step + 1)} disabled={step >= max} aria-label="Next step" style={{ padding: '4px 6px', opacity: step >= max ? 0.4 : 1 }}>
      <ChevronRight size={14} />
    </button>
    <button className="btn-secondary" onClick={() => onChange(max)} disabled={step >= max} title="Show all steps" aria-label="Show all steps" style={{ padding: '4px 6px', opacity: step >= max ? 0.4 : 1 }}>
      <ChevronsRight size={14} />
    </button>
  </div>
);

const SubsetView: React.FC<{ construction: Extract<Construction, { kind: 'subset' }> }> = ({ construction }) => {
  const setStep = useToolkitStore((state) => state.setStep);
  const { result, step } = construction;
  const alphabet = result.dfa.alphabet;
  const rows = result.steps.slice(0, step);
  const current = rows.at(-1);

  return (
    <>
      <Stepper step={step} min={1} max={result.steps.length} label={`Row ${step} / ${result.steps.length}`} onChange={setStep} />
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
        {current?.description}
        {step >= result.steps.length &&
          ` Done: ${result.dfa.states.length} DFA states${result.stateSets[DEAD_STATE_ID] ? ` (including the trap state ${DEAD_STATE_LABEL})` : ''}.`}
      </p>
      <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
              <th style={{ ...cell, textAlign: 'left' }}>DFA state</th>
              <th style={{ ...cell, textAlign: 'left' }}>= ε-closure of</th>
              {alphabet.map((a) => (
                <th key={a} style={cell}>
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dfaStateId} style={{ background: row === current ? 'var(--warning-subtle)' : undefined }}>
                <td style={{ ...cell, color: 'var(--accent)', fontWeight: 700 }}>
                  {row.dfaStateId}
                  {result.dfa.acceptStateIds.includes(row.dfaStateId) && ' ✓'}
                </td>
                <td style={{ ...cell, color: 'var(--text-muted)', whiteSpace: 'normal', overflowWrap: 'anywhere', minWidth: '110px' }}>
                  {/* Break after commas so long sets wrap instead of widening the table */}
                  {result.setLabels[row.dfaStateId].replaceAll(',', ',​')}
                </td>
                {row.moves.map((m) => (
                  <td key={m.symbol} style={{ ...cell, textAlign: 'center', color: m.isNew ? 'var(--warning)' : 'var(--text)' }}>
                    {m.targetDfaStateId === DEAD_STATE_ID ? DEAD_STATE_LABEL : m.targetDfaStateId}
                    {m.isNew && <sup style={{ marginLeft: '2px' }}>new</sup>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        ✓ = accepting (contains an NFA accept state). Faded states on the canvas haven't been discovered yet.
      </p>
    </>
  );
};

const MinimizeView: React.FC<{ construction: Extract<Construction, { kind: 'minimize' }> }> = ({ construction }) => {
  const { setStep, markApplied } = useToolkitStore(
    useShallow((state) => ({ setStep: state.setStep, markApplied: state.markApplied }))
  );
  const setAutomaton = useAutomataStore((state) => state.setAutomaton);
  const { result, step, labels, applied } = construction;
  const round = result.rounds[step];
  const isLast = step >= result.rounds.length - 1;
  const label = (id: string) => labels[id] ?? (id === DEAD_STATE_ID ? DEAD_STATE_LABEL : id);
  const sourceCount = Object.keys(labels).length - result.unreachable.length;

  return (
    <>
      <Stepper step={step} min={0} max={result.rounds.length - 1} label={`Round ${step} / ${result.rounds.length - 1}`} onChange={setStep} />
      {result.unreachable.length > 0 && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Removed unreachable: {result.unreachable.map(label).join(', ')}
        </p>
      )}
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>{round.description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {round.blocks.map((block, i) => (
          <span
            key={block.join(',')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              border: `2px solid ${BLOCK_COLORS[i % BLOCK_COLORS.length]}`,
              background: 'var(--surface)',
            }}
          >
            {`{${block.map(label).join(', ')}}`}
          </span>
        ))}
      </div>
      {isLast && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <p style={{ margin: 0, fontSize: '12px' }}>
            No block splits any further: the minimal DFA has <strong>{result.dfa.states.length}</strong> state
            {result.dfa.states.length === 1 ? '' : 's'} (from {sourceCount}).
          </p>
          {applied ? (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--success)' }}>
              <Check size={13} style={{ verticalAlign: 'middle' }} /> Loaded. Press Ctrl/⌘+Z to go back to the original.
            </p>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                setAutomaton(result.dfa);
                markApplied();
              }}
              style={{ padding: '7px 12px', fontSize: '12px', alignSelf: 'flex-start' }}
            >
              Load minimized DFA
            </button>
          )}
        </div>
      )}
      {!isLast && (
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
          States with the same border color are still indistinguishable after this round.
        </p>
      )}
    </>
  );
};

/** Side panel over the canvas that walks through the current toolkit construction. */
export const ConstructionPanel: React.FC = () => {
  const { construction, setConstruction } = useToolkitStore(
    useShallow((state) => ({ construction: state.construction, setConstruction: state.setConstruction }))
  );
  const automatonId = useAutomataStore((state) => state.automaton.id);
  if (!construction) return null;

  // Hide once the canvas shows a machine the construction isn't about (user loaded something else)
  const relevant =
    construction.kind === 'subset'
      ? construction.result.dfa.id === automatonId
      : construction.sourceId === automatonId || (construction.applied && construction.result.dfa.id === automatonId);
  if (!relevant) return null;

  return (
    <aside
      className="panel"
      aria-label={construction.kind === 'subset' ? 'Subset construction' : 'DFA minimization'}
      style={{
        width: '380px',
        flexShrink: 0,
        height: '100%',
        borderRadius: 0,
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          {construction.kind === 'subset' ? 'Subset construction (NFA → DFA)' : 'DFA minimization'}
        </h3>
        <button className="btn-secondary" onClick={() => setConstruction(null)} aria-label="Close panel" style={{ padding: '4px 6px' }}>
          <X size={14} />
        </button>
      </div>
      {construction.kind === 'subset' ? <SubsetView construction={construction} /> : <MinimizeView construction={construction} />}
    </aside>
  );
};

export default ConstructionPanel;
