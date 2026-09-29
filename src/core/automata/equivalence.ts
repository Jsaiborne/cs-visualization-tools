import type { DFAConfig, NFAConfig } from '../../types/automata';
import { buildNFATransitionTable, getEpsilonClosureWithEdges } from '../automata';
import { inputSymbols } from './subsetConstruction';

export interface EquivalenceResult {
  equivalent: boolean;
  /** Shortest string accepted by exactly one machine (lexicographically first among the shortest) */
  counterexample?: string;
  /** Which machine accepts the counterexample */
  acceptedBy?: 'first' | 'second';
}

type Machine = NFAConfig | DFAConfig;

/** Steps one machine's subset of states; used lazily so only reachable pairs are explored. */
function stepper(machine: Machine) {
  const table = buildNFATransitionTable(machine.transitions);
  const accepting = new Set(machine.acceptStateIds);
  const closure = (ids: string[]) =>
    getEpsilonClosureWithEdges(ids, table, machine.transitions).states.sort();
  return {
    start: machine.startStateId ? closure([machine.startStateId]) : [],
    move: (set: string[], symbol: string) => {
      const reached = new Set<string>();
      for (const s of set) for (const t of table[s]?.[symbol] ?? []) reached.add(t);
      return reached.size > 0 ? closure([...reached]) : [];
    },
    accepts: (set: string[]) => set.some((s) => accepting.has(s)),
  };
}

/**
 * Decides whether two automata (DFA or NFA, with ε-moves) accept the same language by a
 * breadth-first search over pairs of state sets (an on-the-fly product of their subset
 * constructions). BFS in sorted-symbol order yields the shortest distinguishing string.
 */
export function compareAutomata(first: Machine, second: Machine): EquivalenceResult {
  const alphabet = [...new Set([...inputSymbols(first), ...inputSymbols(second)])].sort();
  const a = stepper(first);
  const b = stepper(second);

  const key = (x: string[], y: string[]) => `${x.join(',')}|${y.join(',')}`;
  const queue: { x: string[]; y: string[]; word: string }[] = [{ x: a.start, y: b.start, word: '' }];
  const visited = new Set([key(a.start, b.start)]);

  while (queue.length > 0) {
    const { x, y, word } = queue.shift()!;
    const inFirst = a.accepts(x);
    if (inFirst !== b.accepts(y)) {
      return { equivalent: false, counterexample: word, acceptedBy: inFirst ? 'first' : 'second' };
    }
    for (const symbol of alphabet) {
      const nx = a.move(x, symbol);
      const ny = b.move(y, symbol);
      const k = key(nx, ny);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ x: nx, y: ny, word: word + symbol });
      }
    }
  }

  return { equivalent: true };
}
