import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized,
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
import { useToolkitStore, canvasDecorations } from '../../store/useToolkitStore';
import type { DFAConfig, NFAConfig, ExecutionStep } from '../../types/automata';
import { isEpsilon } from '../../core/epsilon';
import AutomataNode from './AutomataNode';
import SelfLoopEdge from './SelfLoopEdge';
import CurvedEdge from './CurvedEdge';
import { BuilderToolbar } from './BuilderToolbar';

const nodeTypes = {
  automataNode: AutomataNode,
};

const edgeTypes = {
  selfLoop: SelfLoopEdge,
  curved: CurvedEdge,
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
  // Re-fit whenever the canvas itself changes size: window resizes, and side panels opening/closing
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => flow.fitView({ padding: 0.3, duration: 200 }));
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [flow]);

  // Re-fit when a different machine is loaded (preset, regex, share link); edits keep the current view.
  // The fit waits until React Flow has measured the new nodes, otherwise it uses stale bounds.
  const nodesInitialized = useNodesInitialized();
  const fitPending = useRef(true);
  useEffect(() => {
    fitPending.current = true;
  }, [automaton.id]);

  // Toolkit constructions (subset construction growing, minimization blocks) decorate the canvas
  const construction = useToolkitStore((state) => state.construction);
  const decorations = useMemo(() => canvasDecorations(construction, automaton.id), [construction, automaton.id]);

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
          isFaded: decorations.fadedStates.has(st.id),
          isHighlighted: decorations.highlighted === st.id,
          groupColor: decorations.groupColor.get(st.id),
        },
      };
    });
  }, [automaton.states, automaton.type, currentStateId, activeNFAStateIds, decorations]);

  // Transform Automaton transitions into React Flow Edges
  const transitions = automaton.type === 'TM' ? null : (automaton as DFAConfig | NFAConfig).transitions;
  const derivedEdges: Edge[] = useMemo(() => {
    if (!transitions) return [];
    const activeEdgeSet = new Set(activeEdgeIds);
    if (activeTransitionId) activeEdgeSet.add(activeTransitionId);

    // Edges sharing a pair of states (either direction, or a state with itself) are spread apart
    const pairKey = (t: { from: string; to: string }) => [t.from, t.to].sort().join('\u0000');
    const groupSizes = new Map<string, number>();
    for (const t of transitions) groupSizes.set(pairKey(t), (groupSizes.get(pairKey(t)) ?? 0) + 1);
    const seen = new Map<string, number>();

    return transitions.map((t) => {
      const isSelfLoop = t.from === t.to;
      const key = pairKey(t);
      const offsetIndex = seen.get(key) ?? 0;
      seen.set(key, offsetIndex + 1);
      const isEpsilonEdge = isEpsilon(t.symbol);
      const isEdgeActive = activeEdgeSet.has(t.id);
      const opacity = decorations.fadedEdgesFrom.has(t.from) || decorations.fadedStates.has(t.to) ? 0.12 : 1;

      return {
        id: t.id,
        source: t.from,
        target: t.to,
        label: t.symbol,
        animated: isEdgeActive,
        type: isSelfLoop ? 'selfLoop' : 'curved',
        data: isSelfLoop ? { loopIndex: offsetIndex } : { offsetIndex, groupSize: groupSizes.get(key) },
        style: {
          // ε-edges are told apart by their dash; color only marks the active step
          stroke: isEdgeActive ? 'var(--accent)' : 'var(--text-faint)',
          strokeWidth: isEdgeActive ? 2.5 : 1.5,
          strokeDasharray: isEpsilonEdge ? '6 4' : 'none',
          transition: 'stroke 300ms ease, stroke-width 300ms ease, opacity 300ms ease',
          opacity,
        },
        labelStyle: {
          fill: isEdgeActive ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: '13px',
          opacity,
        },
        labelBgStyle: {
          fill: 'var(--bg)',
          rx: 4,
          ry: 4,
          opacity,
        },
        labelBgPadding: [6, 4],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeActive ? 'var(--accent)' : 'var(--text-faint)',
          width: 16,
          height: 16,
        },
      };
    });
  }, [transitions, activeEdgeIds, activeTransitionId, decorations]);

  // React Flow is driven from local state so drags and selection render immediately;
  // the store stays the source of truth and is re-synced whenever it changes.
  const [nodes, setNodes] = useState<Node[]>(derivedNodes);
  const [edges, setEdges] = useState<Edge[]>(derivedEdges);
  useEffect(() => setNodes((prev) => preserveSelection(prev, derivedNodes)), [derivedNodes]);
  useEffect(() => setEdges((prev) => preserveSelection(prev, derivedEdges)), [derivedEdges]);

  useEffect(() => {
    if (!fitPending.current || !nodesInitialized) return;
    fitPending.current = false;
    flow.fitView({ padding: 0.3, duration: 200 });
  }, [nodesInitialized, nodes, flow]);

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
      ref={containerRef}
      id="dfa-canvas-viewport"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        containerType: 'inline-size',
        background: 'var(--bg)',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => (node.data.isActive ? 'var(--accent)' : 'var(--border)')}
          maskColor="var(--overlay)"
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
            background: 'var(--overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleConfirmConnection}
            className="panel"
            style={{
              width: '320px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Add Transition Edge
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Specify transition symbol for <code style={{ color: 'var(--accent)' }}>{pendingConnection.source}</code> ➔ <code style={{ color: 'var(--cat-2)' }}>{pendingConnection.target}</code>:
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
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'var(--text)',
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
        className="panel"
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
                ? 'var(--success)'
                : status === 'REJECTED'
                ? 'var(--danger)'
                : 'var(--accent)',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
          State: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{currentStateId}</code>
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
