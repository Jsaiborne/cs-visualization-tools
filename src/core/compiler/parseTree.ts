import { EPSILON, END_MARKER } from '../../types/cfg';
import type { Grammar, LL1ExecutionStep } from '../../types/cfg';

export interface ParseTreeNode {
  id: string;
  symbol: string;
  kind: 'nonterminal' | 'terminal' | 'epsilon';
  children: ParseTreeNode[];
  /** Step at which the node appears in the tree */
  createdAtStep: number;
  /** Step at which the node was expanded (nonterminal) or matched (terminal) */
  doneAtStep?: number;
}

export interface ParseTreeResult {
  root: ParseTreeNode | null;
  /** For each step, the id of the node that step works on (top of the stack) */
  activeNodeByStep: (string | null)[];
}

/**
 * Replays an LL(1) trace into a parse tree. The top of the parse stack is always the leftmost
 * unfinished leaf, so a node stack mirrors the symbol stack: PREDICT replaces the top node with its
 * children (an ε leaf for A → ε), MATCH completes the top terminal.
 */
export function buildLL1ParseTree(
  steps: LL1ExecutionStep[],
  grammar: Pick<Grammar, 'startSymbol' | 'nonTerminals'>
): ParseTreeResult {
  const { startSymbol } = grammar;
  if (!startSymbol || steps.length === 0) return { root: null, activeNodeByStep: steps.map(() => null) };
  const nonTerminals = new Set(grammar.nonTerminals);

  let counter = 0;
  const make = (symbol: string, kind: ParseTreeNode['kind'], step: number): ParseTreeNode => ({
    id: `n${counter++}`,
    symbol,
    kind,
    children: [],
    createdAtStep: step,
  });

  const root = make(startSymbol, 'nonterminal', 0);
  const stack: (ParseTreeNode | null)[] = [null, root]; // null stands for $
  const activeNodeByStep: (string | null)[] = [];

  for (const [index, step] of steps.entries()) {
    const top = stack[stack.length - 1] ?? null;
    activeNodeByStep.push(top?.id ?? null);
    if (!top || step.topOfStack === END_MARKER) continue;

    if (step.status === 'PREDICT' && step.appliedProduction) {
      stack.pop();
      top.doneAtStep = index;
      const rhs = step.appliedProduction.rhs;
      if (rhs.length === 1 && rhs[0] === EPSILON) {
        top.children = [make(EPSILON, 'epsilon', index + 1)];
      } else {
        // Children appear once the prediction has been applied (the next step)
        top.children = rhs.map((sym) => make(sym, nonTerminals.has(sym) ? 'nonterminal' : 'terminal', index + 1));
        for (let i = top.children.length - 1; i >= 0; i--) stack.push(top.children[i]);
      }
    } else if (step.status === 'MATCH') {
      stack.pop();
      top.doneAtStep = index;
    }
  }

  return { root, activeNodeByStep };
}

/** The terminal leaves of a tree, left to right (its yield, without ε). */
export function treeYield(node: ParseTreeNode | null): string[] {
  if (!node) return [];
  if (node.children.length === 0) return node.kind === 'terminal' ? [node.symbol] : [];
  return node.children.flatMap(treeYield);
}
