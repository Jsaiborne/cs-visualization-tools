import type { AutomatonDefinition, StateNode } from '../../types/automata';
import { isEpsilon } from '../epsilon';

interface ExportEdge {
  from: string;
  to: string;
  labels: string[];
}

/** Transitions grouped per (from, to) pair, so parallel edges become one edge with a label list. */
function groupedEdges(automaton: AutomatonDefinition): ExportEdge[] {
  const groups = new Map<string, ExportEdge>();
  const add = (from: string, to: string, label: string) => {
    const key = `${from}\u0000${to}`;
    const group = groups.get(key) ?? { from, to, labels: [] };
    if (!group.labels.includes(label)) group.labels.push(label);
    groups.set(key, group);
  };
  if (automaton.type === 'TM') {
    for (const r of automaton.transitions) add(r.fromState, r.nextState, `${r.read}/${r.write},${r.move}`);
  } else {
    for (const t of automaton.transitions) add(t.from, t.to, t.symbol);
  }
  return [...groups.values()];
}

function acceptingIds(automaton: AutomatonDefinition): Set<string> {
  return new Set(automaton.type === 'TM' ? [automaton.acceptStateId] : automaton.acceptStateIds);
}

/** Canvas coordinates of each state; states without one are placed on a row. */
function positions(states: StateNode[]): Map<string, { x: number; y: number }> {
  return new Map(states.map((s, i) => [s.id, { x: s.x ?? 150 + i * 200, y: s.y ?? 200 }]));
}

// --- TikZ ---------------------------------------------------------------------------------

const TEX_SPECIALS: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '$': '\\$',
  '&': '\\&',
  '#': '\\#',
  '%': '\\%',
  '_': '\\_',
  '^': '\\textasciicircum{}',
  '~': '\\textasciitilde{}',
};

function texEscape(text: string): string {
  return text.replace(/[\\{}$&#%_^~]/g, (c) => TEX_SPECIALS[c]);
}

/** q0 → $q_{0}$ ; anything else is escaped text. */
function texStateLabel(label: string): string {
  const m = label.match(/^([A-Za-z]+)(\d+)$/);
  return m ? `$${m[1]}_{${m[2]}}$` : texEscape(label);
}

function texSymbol(symbol: string): string {
  return isEpsilon(symbol) ? '$\\varepsilon$' : texEscape(symbol);
}

function texNodeName(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, (c) => `x${c.charCodeAt(0).toString(16)}`);
}

/** Canvas pixels → TikZ centimetres (y flipped: canvas y grows downward). */
const PX_PER_CM = 100;
const cm = (px: number) => (Math.round((px / PX_PER_CM) * 100) / 100).toFixed(2);

/**
 * A standalone TikZ picture using the `automata` library. Layout follows the canvas;
 * accepting states are double circles, the start state gets an initial arrow, self-loops go
 * above, and edges between the same two states in both directions bend apart.
 */
export function toTikz(automaton: AutomatonDefinition): string {
  const accepting = acceptingIds(automaton);
  const pos = positions(automaton.states);
  const edges = groupedEdges(automaton);
  const pairs = new Set(edges.map((e) => `${e.from}\u0000${e.to}`));

  const lines: string[] = [
    `% ${automaton.name}`,
    '% Requires: \\usepackage{tikz} \\usetikzlibrary{automata, positioning, arrows.meta}',
    '\\begin{tikzpicture}[>={Stealth[round]}, shorten >=1pt, auto, every state/.style={minimum size=1cm}]',
  ];

  for (const s of automaton.states) {
    const opts = ['state'];
    if (s.id === automaton.startStateId) opts.push('initial');
    if (accepting.has(s.id)) opts.push('accepting');
    const p = pos.get(s.id)!;
    lines.push(`  \\node[${opts.join(', ')}] (${texNodeName(s.id)}) at (${cm(p.x)}, ${cm(-p.y)}) {${texStateLabel(s.label)}};`);
  }

  if (edges.length > 0) {
    lines.push('  \\path[->]');
    for (const e of edges) {
      const label = e.labels.map(texSymbol).join(', ');
      const style =
        e.from === e.to ? 'loop above' : pairs.has(`${e.to}\u0000${e.from}`) ? 'bend left=15' : '';
      const edgeOpts = style ? `[${style}]` : '';
      const target = e.from === e.to ? '()' : `(${texNodeName(e.to)})`;
      lines.push(`    (${texNodeName(e.from)}) edge${edgeOpts} node {${label}} ${target}`);
    }
    lines[lines.length - 1] += ';';
  }

  lines.push('\\end{tikzpicture}');
  return lines.join('\n') + '\n';
}

// --- Graphviz DOT ---------------------------------------------------------------------------

function dotString(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** A Graphviz digraph, laid out left to right, with an invisible point feeding the start state. */
export function toDot(automaton: AutomatonDefinition): string {
  const accepting = acceptingIds(automaton);
  const lines: string[] = [
    `digraph ${dotString(automaton.name)} {`,
    '  rankdir=LR;',
    '  node [shape=circle];',
    '  __start [shape=point, label=""];',
  ];
  for (const s of automaton.states) {
    const attrs = [`label=${dotString(s.label)}`];
    if (accepting.has(s.id)) attrs.push('shape=doublecircle');
    lines.push(`  ${dotString(s.id)} [${attrs.join(', ')}];`);
  }
  if (automaton.startStateId) {
    lines.push(`  __start -> ${dotString(automaton.startStateId)};`);
  }
  for (const e of groupedEdges(automaton)) {
    const label = e.labels.map((l) => (isEpsilon(l) ? 'ε' : l)).join(', ');
    lines.push(`  ${dotString(e.from)} -> ${dotString(e.to)} [label=${dotString(label)}];`);
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}
