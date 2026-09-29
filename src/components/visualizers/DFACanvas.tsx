import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { DFAConfig, NFAConfig, ExecutionStep } from '../../types/automata';
import { isEpsilon } from '../../core/epsilon';
import AutomataNode from './AutomataNode';
import { BuilderToolbar } from './BuilderToolbar';

const nodeTypes = {
  automataNode: AutomataNode,
};

const NO_IDS: string[] = [];

/** Keeps React Flow's per-element `selected` flag when elements are re-derived from the store. */
function preserveSelection<T extends Node | Edge>(prev: T[], next: T[]): T[] {
  const selected = new Set(prev.filter((el) => el.selected).map((el) => el.id));
  return selected.size === 0 ? next : next.map((el) => (selected.has(el.id) ? { ...el, selected: true } : el));
}

const DFACanvasInner: React.FC = () => {
  const {
    automaton,
    executionSteps,
    currentStepIndex,
    addEdge,
    removeElement,
    updateNodePosition,
  } = useAutomataStore(
    useShallow((state) => ({
      automaton: state.automaton,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
      addEdge: state.addEdge,
      removeElement: state.removeElement,
      updateNodePosition: state.updateNodePosition,
    }))
  );


  // Edge Label Prompt Modal State
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [transitionSymbol, setTransitionSymbol] = useState<string>('0');

  const currentStep: ExecutionStep | undefined = executionSteps[currentStepIndex];

  const activeNFAStateIds = currentStep?.currentNFAStateIds ?? NO_IDS;
  const activeEdgeIds = currentStep?.activeTransitionIds ?? NO_IDS;
  const currentStateId = currentStep?.currentStateId ?? automaton.startStateId;
  const activeTransitionId = currentStep?.activeTransitionId;
  const status = currentStep?.status ?? 'PENDING';

  const flow = useReactFlow();
  useEffect(() => {
    const handleResize = () => {
      window.requestAnimationFrame(() => flow.fitView({ padding: 0.3, duration: 200 }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [flow]);

  // Transform Automaton states into React Flow Nodes
  const derivedNodes: Node[] = useMemo(() => {
    const activeSet = new Set(activeNFAStateIds);
    return automaton.states.map((st, idx) => {
      const isActive = automaton.type === 'NFA'
        ? activeSet.has(st.id)
        : st.id === currentStateId;

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
  }, [automaton.states, automaton.type, currentStateId, activeNFAStateIds]);

  // Transform Automaton transitions into React Flow Edges
  const transitions = automaton.type === 'TM' ? null : (automaton as DFAConfig | NFAConfig).transitions;
  const derivedEdges: Edge[] = useMemo(() => {
    if (!transitions) return [];
    const activeEdgeSet = new Set(activeEdgeIds);
    if (activeTransitionId) activeEdgeSet.add(activeTransitionId);

    return transitions.map((t) => {
      const isSelfLoop = t.from === t.to;
      const isEpsilonEdge = isEpsilon(t.symbol);
      const isEdgeActive = activeEdgeSet.has(t.id);

      return {
        id: t.id,
        source: t.from,
        target: t.to,
        label: t.symbol,
        animated: isEdgeActive,
        type: isSelfLoop ? 'smoothstep' : 'default',
        style: {
          stroke: isEdgeActive ? (isEpsilonEdge ? '#c084fc' : '#38bdf8') : (isEpsilonEdge ? '#a855f7' : '#64748b'),
          strokeWidth: isEdgeActive ? 3 : 2,
          strokeDasharray: isEpsilonEdge ? '6 4' : 'none',
          transition: 'stroke 300ms ease, stroke-width 300ms ease',
        },
        labelStyle: {
          fill: isEdgeActive ? (isEpsilonEdge ? '#c084fc' : '#38bdf8') : (isEpsilonEdge ? '#c084fc' : '#94a3b8'),
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
          color: isEdgeActive ? (isEpsilonEdge ? '#c084fc' : '#38bdf8') : (isEpsilonEdge ? '#a855f7' : '#64748b'),
          width: 18,
          height: 18,
        },
      };
    });
  }, [transitions, activeEdgeIds, activeTransitionId]);

  // React Flow is driven from local state so drags and selection render immediately;
  // the store stays the source of truth and is re-synced whenever it changes.
  const [nodes, setNodes] = useState<Node[]>(derivedNodes);
  const [edges, setEdges] = useState<Edge[]>(derivedEdges);
  useEffect(() => setNodes((prev) => preserveSelection(prev, derivedNodes)), [derivedNodes]);
  useEffect(() => setEdges((prev) => preserveSelection(prev, derivedEdges)), [derivedEdges]);

  const selectedNodeId = nodes.find((n) => n.selected)?.id ?? null;
  const selectedEdgeId = selectedNodeId ? null : (edges.find((e) => e.selected)?.id ?? null);

  // Node changes handler (deleting, selecting)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const local = changes.filter((change) => change.type !== 'remove');
      if (local.length > 0) setNodes((nds) => applyNodeChanges(local, nds));
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeElement(change.id);
        }
      });
    },
    [removeElement]
  );

  // Edge changes handler (deleting, selecting)
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const local = changes.filter((change) => change.type !== 'remove');
      if (local.length > 0) setEdges((eds) => applyEdgeChanges(local, eds));
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeElement(change.id);
        }
      });
    },
    [removeElement]
  );

  // Handle node drag stop -> update position in store
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateNodePosition]
  );

  // Handle user connecting two nodes -> open symbol prompt modal
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      setPendingConnection(connection);
      setTransitionSymbol(automaton.alphabet[0] || '0');
    }
  }, [automaton.alphabet]);

  // Submit new edge with transition symbol
  const handleConfirmConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingConnection?.source && pendingConnection?.target && transitionSymbol.trim()) {
      addEdge(pendingConnection.source, pendingConnection.target, transitionSymbol.trim());
      setPendingConnection(null);
      setTransitionSymbol('');
    }
  };


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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
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

        {/* Builder Toolbar Panel */}
        <Panel position="top-right">
          <BuilderToolbar
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
          />
        </Panel>
      </ReactFlow>

      {/* Edge Label Input Modal */}
      {pendingConnection && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 13, 22, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleConfirmConnection}
            className="glass-panel"
            style={{
              width: '320px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-glass)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Add Transition Edge
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Specify transition symbol for <code style={{ color: 'var(--accent-blue)' }}>{pendingConnection.source}</code> ➔ <code style={{ color: 'var(--accent-purple)' }}>{pendingConnection.target}</code>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Symbol(s), comma-separated (e.g. 0, 1, a, ε)
              </label>
              <input
                type="text"
                autoFocus
                value={transitionSymbol}
                onChange={(e) => setTransitionSymbol(e.target.value)}
                placeholder="Enter character"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingConnection(null)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Add Transition
              </button>
            </div>
          </form>
        </div>
      )}

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
              status === 'ACCEPTED'
                ? 'var(--accent-emerald)'
                : status === 'REJECTED'
                ? 'var(--accent-rose)'
                : 'var(--accent-blue)',
            boxShadow: '0 0 10px currentColor',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
          State: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{currentStateId}</code>
        </span>
      </div>
    </div>
  );
};

export const DFACanvas: React.FC = () => (
  <ReactFlowProvider>
    <DFACanvasInner />
  </ReactFlowProvider>
);

export default DFACanvas;
