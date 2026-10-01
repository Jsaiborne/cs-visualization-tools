import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useGrammarStore } from '../../store/useGrammarStore';
import { eliminateLeftRecursion, leftFactor, grammarToText } from '../../core/compiler/grammarTransforms';

export type GrammarTransform = 'left-recursion' | 'left-factor';

const TITLES: Record<GrammarTransform, string> = {
  'left-recursion': 'Remove left recursion',
  'left-factor': 'Left-factor the grammar',
};

const codeBlock: React.CSSProperties = {
  margin: 0,
  padding: '8px 10px',
  borderRadius: '6px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
};

/** Shows each step of a grammar transformation and applies the result to the editor. */
export const GrammarTransformDialog: React.FC<{ transform: GrammarTransform; onClose: () => void }> = ({
  transform,
  onClose,
}) => {
  const grammar = useGrammarStore((state) => state.grammar);
  const setGrammarText = useGrammarStore((state) => state.setGrammarText);

  const result = useMemo(
    () => (transform === 'left-recursion' ? eliminateLeftRecursion(grammar) : leftFactor(grammar)),
    [grammar, transform]
  );
  const before = grammarToText(grammar);
  const after = grammarToText(result.grammar);
  const unchanged = before === after;

  return (
    <Modal title={TITLES[transform]} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current grammar</div>
          <pre style={codeBlock}>{before}</pre>
        </div>

        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.steps.map((step, i) => (
            <li key={i} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '4px' }}>{step.description}</div>
              {!unchanged && <pre style={codeBlock}>{step.grammarText}</pre>}
            </li>
          ))}
        </ol>

        {result.warnings.map((warning) => (
          <div key={warning} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--warning)' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /> {warning}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '7px 14px', fontSize: '12px' }}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={unchanged}
            onClick={() => {
              setGrammarText(after);
              onClose();
            }}
            style={{ padding: '7px 14px', fontSize: '12px', opacity: unchanged ? 0.5 : 1 }}
          >
            Apply to editor
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GrammarTransformDialog;
