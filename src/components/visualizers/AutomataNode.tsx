import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface AutomataNodeData {
  label: string;
  isStart?: boolean;
  isAcceptState?: boolean;
  isActive?: boolean;
  /** Toolkit: not yet discovered at the current construction step */
  isFaded?: boolean;
  /** Toolkit: the state the current construction step is about */
  isHighlighted?: boolean;
  /** Toolkit: color of the partition block this state belongs to (minimization) */
  groupColor?: string;
  [key: string]: unknown;
}

/** Long labels (subset-construction sets) shrink and wrap to stay inside the circle. */
function labelFontSize(label: string): number {
  if (label.length <= 3) return 15;
  if (label.length <= 6) return 13;
  if (label.length <= 12) return 11;
  return 9;
}

export const AutomataNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as AutomataNodeData;
  const { label, isStart, isAcceptState, isActive, isFaded, isHighlighted, groupColor } = nodeData;

  return (
    <div
      title={label}
      style={{
        position: 'relative',
        opacity: isFaded ? 0.18 : 1,
        outline: isHighlighted ? '2px dashed var(--warning)' : 'none',
        outlineOffset: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'var(--surface)',
        // A solid tint (not a glow) marks the active state
        boxShadow: isActive ? 'inset 0 0 0 36px var(--accent-subtle)' : 'none',
        border: isActive
          ? '2px solid var(--accent)'
          : groupColor
          ? `3px solid ${groupColor}`
          : '1.5px solid var(--border-strong)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
      }}
    >
      {/* Connection handles: shown on hover, used to draw new transitions */}
      <Handle type="target" position={Position.Left} className="automata-handle" />
      <Handle type="source" position={Position.Right} className="automata-handle" />
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />

      {/* Start state arrow */}
      {isStart && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-24px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '16px',
            lineHeight: 1,
          }}
        >
          →
        </div>
      )}

      {/* Accepting state: inner ring */}
      {isAcceptState && (
        <div
          style={{
            position: 'absolute',
            inset: '5px',
            borderRadius: '50%',
            border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border-strong)'}`,
            pointerEvents: 'none',
          }}
        />
      )}

      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: `${labelFontSize(label)}px`,
          fontWeight: 600,
          color: 'var(--text)',
          zIndex: 2,
          maxWidth: '62px',
          maxHeight: '58px',
          overflow: 'hidden',
          textAlign: 'center',
          lineHeight: 1.1,
          overflowWrap: 'anywhere',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default AutomataNode;
