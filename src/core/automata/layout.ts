import dagre from '@dagrejs/dagre';

/**
 * Deterministic left-to-right auto-layout (dagre) for generated machines: regex NFAs,
 * subset-construction DFAs, minimized DFAs, LR item-set automata. Returns the states with x/y
 * filled in (dagre gives box centers).
 */
export function layoutStates<T extends { id: string }>(
  states: T[],
  transitions: { from: string; to: string }[],
  /** Node box size; defaults to the 72px automaton circle */
  sizeOf: (state: T) => { width: number; height: number } = () => ({ width: 72, height: 72 })
): (T & { x: number; y: number })[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 120, marginx: 80, marginy: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  states.forEach((state) => {
    g.setNode(state.id, sizeOf(state));
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
