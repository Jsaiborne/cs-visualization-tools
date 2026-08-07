import type { NFAConfig, StateNode, TransitionEdge } from '../../types/automata';

export const EPSILON = 'ε';

export interface NFAFragment {
  start: StateNode;
  accept: StateNode;
  states: StateNode[];
  transitions: TransitionEdge[];
}

/**
 * Inserts explicit concatenation dots ('.') into a regular expression string.
 * E.g., "(a|b)*abb" -> "(a|b)*.a.b.b"
 */
export function insertExplicitConcat(regex: string): string {
  let output = '';
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    output += c1;
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1];
      // Insert '.' if c1 can end an expression and c2 can start an expression
      const c1CanEnd = c1 !== '(' && c1 !== '|';
      const c2CanStart = c2 !== ')' && c2 !== '|' && c2 !== '*';
      if (c1CanEnd && c2CanStart) {
        output += '.';
      }
    }
  }
  return output;
}

/**
 * Converts an infix regex with explicit '.' into postfix notation using Shunting-Yard algorithm.
 * E.g., "(a|b)*.a.b.b" -> "a b | * a . b . b ."
 */
export function infixToPostfix(infix: string): string[] {
  const output: string[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    '*': 3,
    '.': 2,
    '|': 1,
  };

  for (let i = 0; i < infix.length; i++) {
    const char = infix[i];

    if (char === '(') {
      operatorStack.push(char);
    } else if (char === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        output.push(operatorStack.pop()!);
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
        operatorStack.pop();
      }
    } else if (char === '*' || char === '.' || char === '|') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        (precedence[operatorStack[operatorStack.length - 1]] || 0) >= precedence[char]
      ) {
        output.push(operatorStack.pop()!);
      }
      operatorStack.push(char);
    } else {
      // Literal character / symbol
      output.push(char);
    }
  }

  while (operatorStack.length > 0) {
    output.push(operatorStack.pop()!);
  }

  return output;
}

/**
 * Builds an NFAFragment from a postfix regex token stream using Thompson's Construction algorithm.
 */
export function buildThompsonNFA(postfix: string[]): NFAFragment {
  let stateCounter = 0;
  let edgeCounter = 0;

  function createState(): StateNode {
    const id = `q${stateCounter++}`;
    return {
      id,
      label: id,
      isStart: false,
      isAccept: false,
    };
  }

  function createEdge(from: string, to: string, symbol: string): TransitionEdge {
    return {
      id: `e_${from}_${to}_${symbol}_${edgeCounter++}`,
      from,
      to,
      symbol,
    };
  }

  const stack: NFAFragment[] = [];

  for (const token of postfix) {
    if (token === '*') {
      // Kleene Star
      if (stack.length < 1) continue;
      const frag = stack.pop()!;
      const start = createState();
      const accept = createState();

      const transitions: TransitionEdge[] = [
        ...frag.transitions,
        createEdge(start.id, frag.start.id, EPSILON),
        createEdge(start.id, accept.id, EPSILON),
        createEdge(frag.accept.id, frag.start.id, EPSILON),
        createEdge(frag.accept.id, accept.id, EPSILON),
      ];

      const states = [start, ...frag.states, accept];
      stack.push({ start, accept, states, transitions });
    } else if (token === '|') {
      // Union / Choice
      if (stack.length < 2) continue;
      const frag2 = stack.pop()!;
      const frag1 = stack.pop()!;
      const start = createState();
      const accept = createState();

      const transitions: TransitionEdge[] = [
        ...frag1.transitions,
        ...frag2.transitions,
        createEdge(start.id, frag1.start.id, EPSILON),
        createEdge(start.id, frag2.start.id, EPSILON),
        createEdge(frag1.accept.id, accept.id, EPSILON),
        createEdge(frag2.accept.id, accept.id, EPSILON),
      ];

      const states = [start, ...frag1.states, ...frag2.states, accept];
      stack.push({ start, accept, states, transitions });
    } else if (token === '.') {
      // Concatenation
      if (stack.length < 2) continue;
      const frag2 = stack.pop()!;
      const frag1 = stack.pop()!;

      // Connect frag1.accept -> frag2.start via epsilon transition
      const transitions: TransitionEdge[] = [
        ...frag1.transitions,
        ...frag2.transitions,
        createEdge(frag1.accept.id, frag2.start.id, EPSILON),
      ];

      const states = [...frag1.states, ...frag2.states];
      stack.push({
        start: frag1.start,
        accept: frag2.accept,
        states,
        transitions,
      });
    } else {
      // Symbol literal e.g. 'a', 'b', '0', '1'
      const start = createState();
      const accept = createState();
      const edge = createEdge(start.id, accept.id, token);

      stack.push({
        start,
        accept,
        states: [start, accept],
        transitions: [edge],
      });
    }
  }

  if (stack.length === 0) {
    const start = createState();
    const accept = createState();
    return { start, accept, states: [start, accept], transitions: [] };
  }

  return stack[0];
}

import dagre from '@dagrejs/dagre';

/**
 * Computes deterministic auto-layout coordinates for NFA nodes from left to right using Dagre.
 */
export function layoutNFA(
  states: StateNode[],
  transitions: TransitionEdge[],
  _startStateId: string
): StateNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 120, marginx: 80, marginy: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  states.forEach((state) => {
    g.setNode(state.id, { width: 72, height: 72 });
  });

  transitions.forEach((trans) => {
    g.setEdge(trans.from, trans.to);
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

/**
 * Pure compiler function: Regex String -> Strongly-typed NFAConfig with Auto-Layout.
 *
 * Supports operators:
 * - Kleene Star (*)
 * - Union / Disjunction (|)
 * - Concatenation (implicit or explicit .)
 * - Parentheses grouping ()
 */
export function compileRegexToNFA(regexString: string): NFAConfig {
  const cleanInput = regexString.trim().replace(/\s+/g, '');
  if (!cleanInput) {
    throw new Error('Regular expression input cannot be empty.');
  }

  const formatted = insertExplicitConcat(cleanInput);
  const postfix = infixToPostfix(formatted);
  const fragment = buildThompsonNFA(postfix);

  // Mark start and accept states
  fragment.start.isStart = true;
  fragment.accept.isAccept = true;

  // Extract alphabet (unique non-epsilon input symbols)
  const alphabetSet = new Set<string>();
  for (const t of fragment.transitions) {
    if (t.symbol !== EPSILON) {
      alphabetSet.add(t.symbol);
    }
  }
  const alphabet = Array.from(alphabetSet);

  // Apply auto-layout
  const layoutStates = layoutNFA(fragment.states, fragment.transitions, fragment.start.id);

  return {
    id: `nfa_regex_${Date.now()}`,
    name: `NFA from Regex: /${regexString}/`,
    type: 'NFA',
    alphabet,
    startStateId: fragment.start.id,
    acceptStateIds: [fragment.accept.id],
    states: layoutStates,
    transitions: fragment.transitions,
  };
}
