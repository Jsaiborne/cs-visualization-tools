import type { NFAConfig, StateNode, TransitionEdge } from '../../types/automata';

import { EPSILON } from '../epsilon';
import { layoutStates } from './layout';

const POSTFIX_OPERATORS = new Set(['*', '+', '?']);

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
      const c2CanStart = c2 !== ')' && c2 !== '|' && !POSTFIX_OPERATORS.has(c2);
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
    '+': 3,
    '?': 3,
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
      if (operatorStack.length === 0) {
        throw new Error(`Unbalanced parentheses: unexpected ')' at position ${i}.`);
      }
      operatorStack.pop();
    } else if (char in precedence) {
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
    const op = operatorStack.pop()!;
    if (op === '(') {
      throw new Error("Unbalanced parentheses: missing ')'.");
    }
    output.push(op);
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

  const popOperand = (op: string): NFAFragment => {
    const frag = stack.pop();
    if (!frag) {
      throw new Error(`Invalid regex: operator '${op}' is missing an operand.`);
    }
    return frag;
  };

  for (const token of postfix) {
    if (POSTFIX_OPERATORS.has(token)) {
      // Kleene Star (*), One-or-more (+), Optional (?)
      const frag = popOperand(token);
      const start = createState();
      const accept = createState();

      const transitions: TransitionEdge[] = [
        ...frag.transitions,
        createEdge(start.id, frag.start.id, EPSILON),
        createEdge(frag.accept.id, accept.id, EPSILON),
      ];
      if (token !== '+') {
        // Bypass edge: zero occurrences allowed
        transitions.push(createEdge(start.id, accept.id, EPSILON));
      }
      if (token !== '?') {
        // Loop-back edge: repeat the fragment
        transitions.push(createEdge(frag.accept.id, frag.start.id, EPSILON));
      }

      const states = [start, ...frag.states, accept];
      stack.push({ start, accept, states, transitions });
    } else if (token === '|') {
      // Union / Choice
      const frag2 = popOperand(token);
      const frag1 = popOperand(token);
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
      const frag2 = popOperand(token);
      const frag1 = popOperand(token);

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

  if (stack.length !== 1) {
    throw new Error('Invalid regex: expression is empty or has an empty group.');
  }

  return stack[0];
}

/**
 * Pure compiler function: Regex String -> Strongly-typed NFAConfig with Auto-Layout.
 *
 * Supports operators:
 * - Kleene Star (*), One-or-more (+), Optional (?)
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
  const positioned = layoutStates(fragment.states, fragment.transitions);

  return {
    id: `nfa_regex_${Date.now()}`,
    name: `NFA from Regex: /${regexString}/`,
    regex: regexString,
    type: 'NFA',
    alphabet,
    startStateId: fragment.start.id,
    acceptStateIds: [fragment.accept.id],
    states: positioned,
    transitions: fragment.transitions,
  };
}
