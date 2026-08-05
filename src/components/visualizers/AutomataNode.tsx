import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface AutomataNodeData {
  label: string;
  isStart?: boolean;
  isAcceptState?: boolean;
  isActive?: boolean;
  [key: string]: unknown;
}

export const AutomataNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as AutomataNodeData;
  const { label, isStart, isAcceptState, isActive } = nodeData;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: isActive
          ? 'radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'var(--bg-card)',
        border: isActive
          ? '2px solid var(--accent-blue)'
          : '2px solid var(--border-subtle)',
        boxShadow: isActive
          ? '0 0 24px rgba(56, 189, 248, 0.6), 0 0 48px rgba(168, 85, 247, 0.35)'
          : 'var(--shadow-glass)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'var(--glass-backdrop)',
        WebkitBackdropFilter: 'var(--glass-backdrop)',
      }}
    >
      {/* Target & Source Handles for Edge Connection */}
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-blue)', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-purple)', width: '8px', height: '8px' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'var(--accent-blue)', opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'var(--accent-purple)', opacity: 0 }} />

      {/* Start State Indicator Arrow */}
      {isStart && (
        <div
          style={{
            position: 'absolute',
            left: '-26px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            color: 'var(--accent-emerald)',
            fontWeight: 800,
            fontSize: '14px',
          }}
        >
          ➔
        </div>
      )}

      {/* Accept State Concentric Double Ring */}
      {isAcceptState && (
        <div
          style={{
            position: 'absolute',
            inset: '5px',
            borderRadius: '50%',
            border: isActive ? '2px solid var(--accent-blue)' : '2px solid var(--text-secondary)',
            pointerEvents: 'none',
            transition: 'border-color 300ms ease',
          }}
        />
      )}

      {/* State Label */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '15px',
          fontWeight: 700,
          color: isActive ? '#ffffff' : 'var(--text-primary)',
          zIndex: 2,
          textShadow: isActive ? '0 0 8px rgba(56, 189, 248, 0.8)' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default AutomataNode;
