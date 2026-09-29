import type { DFAConfig, StateNode, TransitionEdge } from '../../types/automata';
import { buildDFATransitionTable } from '../automata';
import { inputSymbols, DEAD_STATE_ID, DEAD_STATE_LABEL } from './subsetConstruction';
import { layoutStates } from './layout';

export interface BlockSplit {
  block: string[];
  into: string[][];
  /** Why the block split: states in different parts go to different blocks on this symbol */
  symbol: string;
}

export interface MinimizeRound {
  round: number;
  blocks: string[][];
  splits: BlockSplit[];
  description: string;
}

export interface MinimizeResult {
  dfa: DFAConfig;
  /** States no input can reach; dropped before refinement */
  unreachable: string[];
  /** Partition after each refinement round (round 0 = accepting vs non-accepting) */
  rounds: MinimizeRound[];
  /** Minimized state id → the original states it merges */
  mergedFrom: Record<string, string[]>;
}

const byId = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/**
 * DFA minimization by partition refinement (Moore's algorithm): start from {accepting,
 * non-accepting} and split any block whose states disagree on which block some symbol leads to,
 * until nothing splits. Unreachable states are removed first; a missing transition is treated as
 * a move to an implicit dead state, so incomplete DFAs are handled too.
 */
export function minimizeDfa(dfa: DFAConfig): MinimizeResult {
  const alphabet = inputSymbols(dfa);
  const table = buildDFATransitionTable(dfa.transitions);
  const labelOf = new Map(dfa.states.map((s) => [s.id, s.label]));
  const accepting = new Set(dfa.acceptStateIds);

  // Reachable states, in BFS order from the start state (gives stable, readable ids)
  const order: string[] = [];
  const seen = new Set<string>();
  const queue = dfa.startStateId ? [dfa.startStateId] : [];
  let usesDead = false;
  while (queue.length > 0) {
    const s = queue.shift()!;
    if (seen.has(s)) continue;
    seen.add(s);
    order.push(s);
    for (const a of alphabet) {
      const t = table[s]?.[a];
      if (t === undefined) usesDead = true;
      else if (!seen.has(t)) queue.push(t);
    }
  }
  const unreachable = dfa.states.map((s) => s.id).filter((id) => !seen.has(id));

  // An explicit dead state for missing moves (unless the DFA already has one with that id)
  const IMPLICIT_DEAD = seen.has(DEAD_STATE_ID) ? '__implicit_dead__' : DEAD_STATE_ID;
  const next = (s: string, a: string) => (s === IMPLICIT_DEAD ? IMPLICIT_DEAD : (table[s]?.[a] ?? IMPLICIT_DEAD));
  const allStates = usesDead ? [...order, IMPLICIT_DEAD] : order;
  const labelFor = (id: string) => (id === IMPLICIT_DEAD ? DEAD_STATE_LABEL : (labelOf.get(id) ?? id));

  // Round 0: accepting vs non-accepting
  let blocks = [allStates.filter((s) => accepting.has(s)), allStates.filter((s) => !accepting.has(s))].filter(
    (b) => b.length > 0
  );
  const describe = (bs: string[][]) => bs.map((b) => `{${b.map(labelFor).join(',')}}`).join(' ');
  const rounds: MinimizeRound[] = [
    { round: 0, blocks, splits: [], description: `Start: accepting vs non-accepting → ${describe(blocks)}` },
  ];

  for (let round = 1; ; round++) {
    const blockOf = new Map<string, number>();
    blocks.forEach((b, i) => b.forEach((s) => blockOf.set(s, i)));

    const refined: string[][] = [];
    const splits: BlockSplit[] = [];
    for (const block of blocks) {
      const groups = new Map<string, string[]>();
      for (const s of block) {
        const signature = alphabet.map((a) => blockOf.get(next(s, a))).join(',');
        groups.set(signature, [...(groups.get(signature) ?? []), s]);
      }
      const parts = [...groups.values()];
      refined.push(...parts);
      if (parts.length > 1) {
        const [first, second] = parts;
        const symbol =
          alphabet.find((a) => blockOf.get(next(first[0], a)) !== blockOf.get(next(second[0], a))) ?? alphabet[0];
        splits.push({ block, into: parts, symbol });
      }
    }

    if (splits.length === 0) break;
    blocks = refined;
    rounds.push({
      round,
      blocks,
      splits,
      description:
        splits
          .map((sp) => `{${sp.block.map(labelFor).join(',')}} splits on '${sp.symbol}'`)
          .join('; ') + ` → ${describe(blocks)}`,
    });
  }

  // Build the minimized DFA: one state per block, ordered by first appearance in BFS order
  const blockIndex = new Map<string, number>();
  blocks.forEach((b, i) => b.forEach((s) => blockIndex.set(s, i)));
  const orderedBlocks = [...blocks].sort(
    (x, y) => allStates.indexOf(x[0]) - allStates.indexOf(y[0])
  );
  const idOfBlock = new Map<number, string>();
  const mergedFrom: Record<string, string[]> = {};
  const states: StateNode[] = orderedBlocks.map((block, i) => {
    const members = [...block].sort((a, b) => allStates.indexOf(a) - allStates.indexOf(b));
    const id = `M${i}`;
    idOfBlock.set(blockIndex.get(block[0])!, id);
    mergedFrom[id] = members;
    return {
      id,
      label: members.length === 1 ? labelFor(members[0]) : `{${members.map(labelFor).sort(byId).join(',')}}`,
      isStart: members.includes(dfa.startStateId),
      isAccept: members.some((m) => accepting.has(m)),
    };
  });

  const transitions: TransitionEdge[] = [];
  orderedBlocks.forEach((block) => {
    const from = idOfBlock.get(blockIndex.get(block[0])!)!;
    for (const a of alphabet) {
      const to = idOfBlock.get(blockIndex.get(next(block[0], a))!)!;
      transitions.push({ id: `m_${from}_${a}`, from, to, symbol: a });
    }
  });

  const minimized: DFAConfig = {
    id: `dfa_min_${Date.now()}`,
    name: `Minimized ${dfa.name}`,
    type: 'DFA',
    alphabet,
    startStateId: states.find((s) => s.isStart)?.id ?? '',
    acceptStateIds: states.filter((s) => s.isAccept).map((s) => s.id),
    states: layoutStates(states, transitions),
    transitions,
    regex: dfa.regex,
  };

  return { dfa: minimized, unreachable, rounds, mergedFrom };
}
