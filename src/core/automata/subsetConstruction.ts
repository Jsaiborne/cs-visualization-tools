import type { DFAConfig, NFAConfig, StateNode, TransitionEdge } from '../../types/automata';
import { buildNFATransitionTable, getEpsilonClosureWithEdges } from '../automata';
import { isEpsilon } from '../epsilon';
import { layoutStates } from './layout';

export const DEAD_STATE_ID = 'dead';
export const DEAD_STATE_LABEL = '∅';

export interface SubsetMove {
  symbol: string;
  /** ε-closure of the states reachable on `symbol`; empty means the dead state */
  targetNfaStates: string[];
  targetDfaStateId: string;
  /** True when this move discovered a new DFA state */
  isNew: boolean;
}

export interface SubsetStep {
  dfaStateId: string;
  nfaStates: string[];
  moves: SubsetMove[];
  description: string;
}

export interface SubsetResult {
  dfa: DFAConfig;
  steps: SubsetStep[];
  /** DFA state id → the set of source states it stands for */
  stateSets: Record<string, string[]>;
  /** DFA state id → that set written with the source states' labels, e.g. "{q0,q2}" */
  setLabels: Record<string, string>;
}

const byId = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Input symbols of a machine: its alphabet plus any non-ε symbol used on a transition. */
export function inputSymbols(machine: NFAConfig | DFAConfig): string[] {
  const symbols = new Set(machine.alphabet.filter((s) => !isEpsilon(s)));
  for (const t of machine.transitions) {
    if (!isEpsilon(t.symbol)) symbols.add(t.symbol);
  }
  return [...symbols];
}

/**
 * Subset construction: converts an NFA (with ε-moves) into an equivalent complete DFA. Each DFA
 * state is the ε-closure of a set of NFA states; a ∅ trap state is added when some set has no
 * move on a symbol. Works on DFAs too (completing them), which the equivalence checker relies on.
 */
export function nfaToDfa(machine: NFAConfig | DFAConfig): SubsetResult {
  const table = buildNFATransitionTable(machine.transitions);
  const alphabet = inputSymbols(machine);
  const accepting = new Set(machine.acceptStateIds);
  const labelOf = new Map(machine.states.map((s) => [s.id, s.label]));

  const keyOf = (set: string[]) => set.join('\u0000');
  const setLabel = (set: string[]) => `{${set.map((id) => labelOf.get(id) ?? id).join(',')}}`;

  const dfaIdByKey = new Map<string, string>();
  const stateSets: Record<string, string[]> = {};
  const setLabels: Record<string, string> = {};
  const states: StateNode[] = [];
  const transitions: TransitionEdge[] = [];
  const steps: SubsetStep[] = [];
  const queue: string[] = [];
  let needsDead = false;

  const discover = (set: string[]): { id: string; isNew: boolean } => {
    if (set.length === 0) {
      needsDead = true;
      return { id: DEAD_STATE_ID, isNew: false };
    }
    const key = keyOf(set);
    const existing = dfaIdByKey.get(key);
    if (existing) return { id: existing, isNew: false };
    const id = `D${dfaIdByKey.size}`;
    dfaIdByKey.set(key, id);
    stateSets[id] = set;
    setLabels[id] = setLabel(set);
    // Short names on the canvas (textbook style); the construction table maps each to its set
    states.push({
      id,
      label: id,
      isStart: dfaIdByKey.size === 1,
      isAccept: set.some((s) => accepting.has(s)),
    });
    queue.push(id);
    return { id, isNew: true };
  };

  const closure = (ids: string[]) =>
    getEpsilonClosureWithEdges(ids, table, machine.transitions).states.sort(byId);

  const start = discover(machine.startStateId ? closure([machine.startStateId]) : []);

  while (queue.length > 0) {
    const dfaStateId = queue.shift()!;
    const nfaStates = stateSets[dfaStateId];
    const moves: SubsetMove[] = [];

    for (const symbol of alphabet) {
      const reached = new Set<string>();
      for (const s of nfaStates) {
        for (const t of table[s]?.[symbol] ?? []) reached.add(t);
      }
      const targetNfaStates = reached.size > 0 ? closure([...reached]) : [];
      const target = discover(targetNfaStates);
      moves.push({ symbol, targetNfaStates, targetDfaStateId: target.id, isNew: target.isNew });
      transitions.push({ id: `d_${dfaStateId}_${symbol}`, from: dfaStateId, to: target.id, symbol });
    }

    const discovered = moves.filter((m) => m.isNew).map((m) => m.targetDfaStateId);
    steps.push({
      dfaStateId,
      nfaStates,
      moves,
      description:
        `Process ${dfaStateId} = ${setLabel(nfaStates)}` +
        (discovered.length > 0 ? `: new state${discovered.length > 1 ? 's' : ''} ${discovered.join(', ')}.` : '.'),
    });
  }

  if (needsDead) {
    stateSets[DEAD_STATE_ID] = [];
    setLabels[DEAD_STATE_ID] = '{}';
    states.push({ id: DEAD_STATE_ID, label: DEAD_STATE_LABEL, isStart: false, isAccept: false });
    for (const symbol of alphabet) {
      transitions.push({ id: `d_${DEAD_STATE_ID}_${symbol}`, from: DEAD_STATE_ID, to: DEAD_STATE_ID, symbol });
    }
  }

  const dfa: DFAConfig = {
    id: `dfa_subset_${Date.now()}`,
    name: `DFA (subset construction) of ${machine.name}`,
    type: 'DFA',
    alphabet,
    startStateId: start.id,
    acceptStateIds: states.filter((s) => s.isAccept).map((s) => s.id),
    states: layoutStates(states, transitions),
    transitions,
    regex: machine.regex,
  };

  return { dfa, steps, stateSets, setLabels };
}
