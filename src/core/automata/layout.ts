import dagre from '@dagrejs/dagre';
import type { StateNode } from '../../types/automata';

/**
 * Deterministic left-to-right auto-layout (dagre) for generated machines: regex NFAs,
 * subset-construction DFAs, minimized DFAs. Returns the states with x/y filled in.
 */
export function layoutStates(states: StateNode[], transitions: { from: string; to: string }[]): StateNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 120, marginx: 80, marginy: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  states.forEach((state) => {
    g.setNode(state.id, { width: 72, height: 72 });
  });

  transitions.forEach((trans) => {
    if (trans.from !== trans.to) g.setEdge(trans.from, trans.to);
  });

  dagre.layout(g);

  return states.map((s) => {
    const node = g.node(s.id);
    return {
      ...s,
      x: node ? Math.round(node.x) : 100,
      y: node ? Math.round(node.y) : 100,
    };
  });
}
