import { describe, it, expect } from 'vitest';
import { toTikz, toDot } from '../automata/export';
import { compileRegexToNFA } from '../automata/regexCompiler';
import { defaultDFA, binaryIncrementerTM } from '../../store/useAutomataStore';

describe('toTikz', () => {
  const tikz = toTikz(defaultDFA);

  it('places states from canvas coordinates with start/accept markers', () => {
    expect(tikz).toContain('\\node[state, initial, accepting] (q0) at (1.50, -2.00) {$q_{0}$};');
    expect(tikz).toContain('\\node[state] (q1) at (4.50, -2.00) {$q_{1}$};');
  });

  it('draws loops above and bends two-way edges apart', () => {
    expect(tikz).toContain('(q0) edge[loop above] node {1} ()');
    expect(tikz).toContain('(q0) edge[bend left=15] node {0} (q1)');
    expect(tikz).toContain('(q1) edge[bend left=15] node {0} (q0)');
    expect(tikz.trim().endsWith('\\end{tikzpicture}')).toBe(true);
    expect(tikz).toMatch(/\(q1\) edge\[loop above\] node \{1\} \(\);\n\\end\{tikzpicture\}/);
  });

  it('renders epsilon and escapes TeX specials', () => {
    const nfa = compileRegexToNFA('a*');
    expect(toTikz(nfa)).toContain('$\\varepsilon$');
    const odd = { ...defaultDFA, states: defaultDFA.states.map((s) => ({ ...s, label: `{${s.id}}_%` })) };
    expect(toTikz(odd)).toContain('{\\{q0\\}\\_\\%}');
  });

  it('labels Turing machine rules as read/write,move', () => {
    expect(toTikz(binaryIncrementerTM)).toContain('node {1/0,L}');
  });
});

describe('toDot', () => {
  it('emits a left-to-right digraph with a start arrow and double circles', () => {
    const dot = toDot(defaultDFA);
    expect(dot).toContain('rankdir=LR;');
    expect(dot).toContain('__start -> "q0";');
    expect(dot).toContain('"q0" [label="q0", shape=doublecircle];');
    expect(dot).toContain('"q0" -> "q1" [label="0"];');
  });

  it('merges parallel edges into one label list', () => {
    const merged = {
      ...defaultDFA,
      transitions: [
        { id: 'a', from: 'q0', to: 'q1', symbol: '0' },
        { id: 'b', from: 'q0', to: 'q1', symbol: '1' },
      ],
    };
    expect(toDot(merged)).toContain('"q0" -> "q1" [label="0, 1"];');
  });
});
