import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';
import AutomataNode from './AutomataNode';

const nodeTypes = {
  automataNode: AutomataNode,
};

export const DFACanvas: React.FC = () => {
  const { automaton, executionSteps, currentStepIndex } = useAutomataStore();

  const currentStep = executionSteps[currentStepIndex] || {
    currentStateId: automaton.startStateId,
    activeTransitionId: undefined,
    status: 'PENDING',
  };

  const activeStateId = currentStep.currentStateId;
  const activeEdgeId = currentStep.activeTransitionId;

  // Transform Automaton states into React Flow Nodes with reactive isActive data property
  const nodes: Node[] = useMemo(() => {
    return automaton.states.map((st, idx) => {
      const isActive = st.id === activeStateId;
      return {
        id: st.id,
        type: 'automataNode',
        position: {
          x: st.x ?? 150 + idx * 250,
          y: st.y ?? 200,
        },
        data: {
          label: st.label,
          isStart: st.isStart,
          isAcceptState: st.isAccept,
          isActive,
        },
      };
    });
  }, [automaton.states, activeStateId]);

  // Transform Automaton transitions into React Flow Edges
  const edges: Edge[] = useMemo(() => {
    return automaton.transitions.map((t) => {
      const isSelfLoop = t.from === t.to;
      const isEdgeActive = t.id === activeEdgeId;

      return {
        id: t.id,
        source: t.from,
        target: t.to,
        label: t.symbol,
        animated: isEdgeActive,
        type: isSelfLoop ? 'smoothstep' : 'default',
        style: {
          stroke: isEdgeActive ? '#38bdf8' : '#64748b',
          strokeWidth: isEdgeActive ? 3 : 2,
          transition: 'stroke 300ms ease, stroke-width 300ms ease',
        },
        labelStyle: {
          fill: isEdgeActive ? '#38bdf8' : '#94a3b8',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '14px',
        },
        labelBgStyle: {
          fill: 'rgba(15, 23, 42, 0.95)',
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeActive ? '#38bdf8' : '#64748b',
          width: 18,
          height: 18,
        },
      };
    });
  }, [automaton.transitions, activeEdgeId]);

  return (
    <div
      id="dfa-canvas-viewport"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.3) 0%, rgba(9, 13, 22, 0.95) 100%)',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={28} size={1} />
        <Controls
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fill: '#f8fafc',
          }}
        />
        <MiniMap
          style={{
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
          }}
          nodeColor={(node) => (node.data.isActive ? '#38bdf8' : '#334155')}
          maskColor="rgba(9, 13, 22, 0.7)"
        />
      </ReactFlow>

      {/* Floating Canvas Overlay Badge */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background:
              currentStep.status === 'ACCEPTED'
                ? 'var(--accent-emerald)'
                : currentStep.status === 'REJECTED'
                ? 'var(--accent-rose)'
                : 'var(--accent-blue)',
            boxShadow: '0 0 10px currentColor',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
          State: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{activeStateId}</code>
        </span>
      </div>
    </div>
  );
};

export default DFACanvas;
