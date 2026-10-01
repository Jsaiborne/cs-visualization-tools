import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodesChange,
} from '@xyflow/react';
import type { LRTable } from '../../core/compiler/lrParser';
import { itemText } from '../../core/compiler/lrParser';
import { layoutStates } from '../../core/automata/layout';
import SelfLoopEdge from './SelfLoopEdge';

interface LRStateData {
  title: string;
  items: string[];
  isActive: boolean;
  hasConflict: boolean;
  [key: string]: unknown;
}

const ITEM_LINE = 16;
const boxSize = (items: string[]) => ({
  width: Math.max(120, Math.max(...items.map((i) => i.length)) * 6.8 + 28),
  height: 34 + items.length * ITEM_LINE,
});

const LRStateNode: React.FC<NodeProps> = ({ data }) => {
  const { title, items, isActive, hasConflict } = data as LRStateData;
  return (
    <div
      style={{
        ...boxSize(items),
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'var(--accent-subtle)' : 'var(--surface)',
        border: `2px solid ${isActive ? 'var(--accent)' : hasConflict ? 'var(--danger)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text)',
        overflow: 'hidden',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div
        style={{
          padding: '4px 8px',
          fontWeight: 700,
          fontSize: '12px',
          borderBottom: '1px solid var(--border)',
          color: isActive ? 'var(--accent)' : hasConflict ? 'var(--danger)' : 'var(--cat-2)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        {hasConflict && <span title="This state has a conflict">⚠</span>}
      </div>
      <div style={{ padding: '4px 8px' }}>
        {items.map((item) => (
          <div key={item} style={{ height: `${ITEM_LINE}px`, lineHeight: `${ITEM_LINE}px`, whiteSpace: 'nowrap' }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = { lrState: LRStateNode };
const edgeTypes = { selfLoop: SelfLoopEdge };

interface LRStateGraphProps {
  table: LRTable;
  activeState: number | null;
}

const LRStateGraphInner: React.FC<LRStateGraphProps> = ({ table, activeState }) => {
  const conflictStates = useMemo(() => new Set(table.conflicts.map((c) => c.state)), [table]);

  // Layout depends only on the table; stepping just changes node data
  const layout = useMemo(() => {
    const boxes = table.states.map((s) => ({
      id: String(s.id),
      items: s.items.map((i) => itemText(i, table.productions)),
    }));
    const transitions = table.states.flatMap((s) =>
      Object.values(s.transitions).map((to) => ({ from: String(s.id), to: String(to) }))
    );
    return layoutStates(boxes, transitions, (b) => boxSize(b.items));
  }, [table]);

  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    setNodes(
      layout.map((b) => {
        const size = boxSize(b.items);
        return {
          id: b.id,
          type: 'lrState',
          // dagre gives centers; React Flow positions are top-left corners
          position: { x: b.x - size.width / 2, y: b.y - size.height / 2 },
          data: { title: `I${b.id}`, items: b.items, isActive: false, hasConflict: conflictStates.has(Number(b.id)) },
        };
      })
    );
  }, [layout, conflictStates]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        (n.data as LRStateData).isActive === (Number(n.id) === activeState)
          ? n
          : { ...n, data: { ...n.data, isActive: Number(n.id) === activeState } }
      )
    );
  }, [activeState, nodes.length]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

  const edges: Edge[] = useMemo(
    () =>
      table.states.flatMap((s) =>
        Object.entries(s.transitions).map(([symbol, to]) => {
          const isNonTerminal = table.nonTerminals.includes(symbol);
          const color = isNonTerminal ? 'var(--cat-2)' : 'var(--text-faint)';
          return {
            id: `g${s.id}-${symbol}`,
            source: String(s.id),
            target: String(to),
            label: symbol,
            type: s.id === to ? 'selfLoop' : 'default',
            style: { stroke: color, strokeWidth: 1.6 },
            labelStyle: { fill: isNonTerminal ? 'var(--cat-2)' : 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px' },
            labelBgStyle: { fill: 'var(--surface)' },
            labelBgPadding: [4, 2] as [number, number],
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
          };
        })
      ),
    [table]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      nodesConnectable={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="var(--border)" gap={28} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
};

/** Canonical collection of item sets as a goto graph (purple edges = nonterminal gotos). */
export const LRStateGraph: React.FC<LRStateGraphProps> = (props) => (
  <ReactFlowProvider>
    <LRStateGraphInner {...props} />
  </ReactFlowProvider>
);

export default LRStateGraph;
