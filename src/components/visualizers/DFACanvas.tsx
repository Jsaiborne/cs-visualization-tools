import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { DFAConfig, NFAConfig } from '../../types/automata';
import AutomataNode from './AutomataNode';
import { BuilderToolbar } from './BuilderToolbar';

const nodeTypes = {
  automataNode: AutomataNode,
};

export const DFACanvas: React.FC = () => {
  const {
    automaton,
    executionSteps,
    currentStepIndex,
    addEdge,
    removeElement,
    updateNodePosition,
  } = useAutomataStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Edge Label Prompt Modal State
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [transitionSymbol, setTransitionSymbol] = useState<string>('0');

  const currentStep = executionSteps[currentStepIndex] || {
    currentStateId: automaton.startStateId,
    activeTransitionId: undefined,
    status: 'PENDING',
  };

  const activeStateId = currentStep.currentStateId;
  const activeEdgeId = currentStep.activeTransitionId;

  // Transform Automaton states into React Flow Nodes
  const initialNodes: Node[] = useMemo(() => {
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
  const initialEdges: Edge[] = useMemo(() => {
    if (automaton.type === 'TM') return [];
    const dfaOrNfa = automaton as DFAConfig | NFAConfig;
    return dfaOrNfa.transitions.map((t) => {
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

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Sync state changes from store to React Flow state
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  // Node changes handler (dragging, selecting)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Edge changes handler (deleting, selecting)
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeElement(change.id);
        }
      });
      setEdges((eds) => applyEdgeChanges(changes, eds));
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

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const selectedNode = params.nodes[0];
    const selectedEdge = params.edges[0];
    setSelectedNodeId(selectedNode ? selectedNode.id : null);
    setSelectedEdgeId(selectedEdge ? selectedEdge.id : null);
  }, []);

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
        onSelectionChange={onSelectionChange}
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
                Symbol (e.g. 0, 1, a, b, ε)
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
