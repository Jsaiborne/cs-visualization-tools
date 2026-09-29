import { EPSILON, END_MARKER } from '../../types/cfg';
import type { Grammar } from '../../types/cfg';
import { calculateFirstSets, calculateFollowSets, calculateFirstOfSequence } from './cfgEngine';
import { tokenizeInput } from './ll1Parser';
import type { ParseTreeNode } from './parseTree';

export type LRKind = 'LR0' | 'SLR1' | 'LALR1' | 'CLR1';

export const LR_KIND_LABELS: Record<LRKind, string> = {
  LR0: 'LR(0)',
  SLR1: 'SLR(1)',
  LALR1: 'LALR(1)',
  CLR1: 'Canonical LR(1)',
};

export interface LRProduction {
  index: number;
  lhs: string;
  /** Right-hand side without ε: A → ε has an empty rhs */
  rhs: string[];
}

export interface LRItem {
  production: number;
  dot: number;
  /** LR(1)/LALR(1) only: terminals (or $) that may follow a reduction by this item */
  lookaheads: string[];
}

export interface LRState {
  id: number;
  items: LRItem[];
  transitions: Record<string, number>;
}

export type LRAction = { type: 'shift'; state: number } | { type: 'reduce'; production: number } | { type: 'accept' };

export interface LRConflict {
  state: number;
  symbol: string;
  kind: 'shift/reduce' | 'reduce/reduce';
  actions: LRAction[];
}

export interface LRTable {
  kind: LRKind;
  productions: LRProduction[];
  augmentedStart: string;
  states: LRState[];
  /** Column order for the table: terminals then $ */
  terminals: string[];
  nonTerminals: string[];
  action: Record<number, Record<string, LRAction[]>>;
  goto: Record<number, Record<string, number>>;
  conflicts: LRConflict[];
}

// --- Grammar preparation --------------------------------------------------------------------

function augment(grammar: Grammar): { productions: LRProduction[]; start: string } {
  let start = `${grammar.startSymbol}'`;
  const used = new Set([...grammar.nonTerminals, ...grammar.terminals]);
  while (used.has(start)) start += "'";
  const productions: LRProduction[] = [{ index: 0, lhs: start, rhs: [grammar.startSymbol] }];
  for (const p of grammar.productions) {
    const rhs = p.rhs.filter((s) => s !== EPSILON);
    productions.push({ index: productions.length, lhs: p.lhs, rhs });
  }
  return { productions, start };
}

const itemCore = (item: LRItem) => `${item.production}.${item.dot}`;
const stateKey = (items: LRItem[], withLookaheads: boolean) =>
  items
    .map((i) => (withLookaheads ? `${itemCore(i)}/${i.lookaheads.join(',')}` : itemCore(i)))
    .sort()
    .join('|');

// --- Canonical collections ------------------------------------------------------------------

interface Collection {
  states: LRState[];
}

function buildCollection(
  productions: LRProduction[],
  nonTerminals: Set<string>,
  lookaheadMode: boolean,
  firstOf: (sequence: string[]) => Set<string>
): Collection {
  const byLhs = new Map<string, LRProduction[]>();
  for (const p of productions) byLhs.set(p.lhs, [...(byLhs.get(p.lhs) ?? []), p]);

  /** Closure; in lookahead mode items with the same core are merged with their lookaheads unioned. */
  const closure = (kernel: LRItem[]): LRItem[] => {
    const items = new Map<string, LRItem>();
    const queue: LRItem[] = [];
    const add = (item: LRItem) => {
      const key = itemCore(item);
      const existing = items.get(key);
      if (!existing) {
        const copy = { ...item, lookaheads: [...item.lookaheads].sort() };
        items.set(key, copy);
        queue.push(copy);
        return;
      }
      const merged = [...new Set([...existing.lookaheads, ...item.lookaheads])].sort();
      if (merged.length !== existing.lookaheads.length) {
        existing.lookaheads = merged;
        queue.push(existing); // re-propagate the new lookaheads
      }
    };
    kernel.forEach(add);
    while (queue.length > 0) {
      const item = queue.shift()!;
      const p = productions[item.production];
      const next = p.rhs[item.dot];
      if (next === undefined || !nonTerminals.has(next)) continue;
      let lookaheads: string[] = [];
      if (lookaheadMode) {
        const beta = p.rhs.slice(item.dot + 1);
        const la = new Set<string>();
        for (const a of item.lookaheads) {
          for (const t of firstOf([...beta, a])) if (t !== EPSILON) la.add(t);
        }
        lookaheads = [...la];
      }
      for (const q of byLhs.get(next) ?? []) add({ production: q.index, dot: 0, lookaheads });
    }
    // Stable order: kernel first (dot > 0 or the augmented start), then closure items by production
    return [...items.values()].sort((a, b) => {
      const ka = a.dot > 0 || a.production === 0 ? 0 : 1;
      const kb = b.dot > 0 || b.production === 0 ? 0 : 1;
      return ka - kb || a.production - b.production || a.dot - b.dot;
    });
  };

  const states: LRState[] = [];
  const index = new Map<string, number>();
  const intern = (items: LRItem[]) => {
    const key = stateKey(items, lookaheadMode);
    const existing = index.get(key);
    if (existing !== undefined) return existing;
    const id = states.length;
    states.push({ id, items, transitions: {} });
    index.set(key, id);
    return id;
  };

  intern(closure([{ production: 0, dot: 0, lookaheads: lookaheadMode ? [END_MARKER] : [] }]));
  for (let s = 0; s < states.length; s++) {
    const state = states[s];
    const symbols: string[] = [];
    for (const item of state.items) {
      const sym = productions[item.production].rhs[item.dot];
      if (sym !== undefined && !symbols.includes(sym)) symbols.push(sym);
    }
    for (const sym of symbols) {
      const kernel = state.items
        .filter((i) => productions[i.production].rhs[i.dot] === sym)
        .map((i) => ({ ...i, dot: i.dot + 1 }));
      state.transitions[sym] = intern(closure(kernel));
    }
  }
  return { states };
}

/** LALR(1): merge canonical LR(1) states that share the same LR(0) core, unioning lookaheads. */
function mergeCores(lr1: Collection): Collection {
  const coreId = new Map<string, number>();
  const mapping: number[] = [];
  const merged: LRState[] = [];
  for (const state of lr1.states) {
    const key = stateKey(state.items, false);
    let id = coreId.get(key);
    if (id === undefined) {
      id = merged.length;
      coreId.set(key, id);
      merged.push({ id, items: state.items.map((i) => ({ ...i, lookaheads: [...i.lookaheads] })), transitions: {} });
    } else {
      const target = merged[id];
      for (const item of state.items) {
        const into = target.items.find((i) => itemCore(i) === itemCore(item))!;
        into.lookaheads = [...new Set([...into.lookaheads, ...item.lookaheads])].sort();
      }
    }
    mapping[state.id] = id;
  }
  lr1.states.forEach((state) => {
    for (const [sym, to] of Object.entries(state.transitions)) merged[mapping[state.id]].transitions[sym] = mapping[to];
  });
  return { states: merged };
}

// --- Tables ---------------------------------------------------------------------------------

const sameAction = (a: LRAction, b: LRAction) =>
  a.type === b.type &&
  (a.type !== 'shift' || a.state === (b as typeof a).state) &&
  (a.type !== 'reduce' || a.production === (b as typeof a).production);

/**
 * Builds the ACTION/GOTO table for LR(0), SLR(1), LALR(1) or canonical LR(1). The methods differ
 * only in where reductions go: every terminal (LR(0)), FOLLOW(A) (SLR), or the item's lookaheads
 * (LALR / canonical LR). Cells with more than one action are conflicts.
 */
export function buildLRTable(grammar: Grammar, kind: LRKind): LRTable {
  const { productions, start } = augment(grammar);
  const nonTerminalSet = new Set([start, ...grammar.nonTerminals]);
  const augmentedGrammar: Grammar = {
    ...grammar,
    nonTerminals: [start, ...grammar.nonTerminals],
    startSymbol: start,
    productions: productions.map((p) => ({ id: `P${p.index}`, lhs: p.lhs, rhs: p.rhs.length ? p.rhs : [EPSILON] })),
  };
  const firstSets = calculateFirstSets(augmentedGrammar);
  const followSets = calculateFollowSets(grammar, calculateFirstSets(grammar));
  const firstOf = (seq: string[]) => calculateFirstOfSequence(seq, firstSets, grammar.terminals);

  const lookaheadMode = kind === 'LALR1' || kind === 'CLR1';
  const canonical = buildCollection(productions, nonTerminalSet, lookaheadMode, firstOf);
  const { states } = kind === 'LALR1' ? mergeCores(canonical) : canonical;

  const terminals = [...grammar.terminals, END_MARKER];
  const action: LRTable['action'] = {};
  const goto: LRTable['goto'] = {};
  const conflicts: LRConflict[] = [];

  const put = (state: number, symbol: string, act: LRAction) => {
    const cell = (action[state][symbol] ??= []);
    if (!cell.some((a) => sameAction(a, act))) cell.push(act);
  };

  for (const state of states) {
    action[state.id] = {};
    goto[state.id] = {};
    for (const [sym, to] of Object.entries(state.transitions)) {
      if (nonTerminalSet.has(sym)) goto[state.id][sym] = to;
      else put(state.id, sym, { type: 'shift', state: to });
    }
    for (const item of state.items) {
      const p = productions[item.production];
      if (item.dot < p.rhs.length) continue;
      if (p.index === 0) {
        put(state.id, END_MARKER, { type: 'accept' });
        continue;
      }
      const on =
        kind === 'LR0' ? terminals : kind === 'SLR1' ? [...(followSets[p.lhs] ?? [])] : item.lookaheads;
      for (const t of on) put(state.id, t, { type: 'reduce', production: p.index });
    }
    for (const [symbol, cell] of Object.entries(action[state.id])) {
      if (cell.length > 1) {
        conflicts.push({
          state: state.id,
          symbol,
          kind: cell.some((a) => a.type === 'shift') ? 'shift/reduce' : 'reduce/reduce',
          actions: cell,
        });
      }
    }
  }

  return {
    kind,
    productions,
    augmentedStart: start,
    states,
    terminals,
    nonTerminals: grammar.nonTerminals,
    action,
    goto,
    conflicts,
  };
}

// --- Display helpers -------------------------------------------------------------------------

export function productionText(p: LRProduction): string {
  return `${p.lhs} → ${p.rhs.length ? p.rhs.join(' ') : EPSILON}`;
}

/** An item in dot notation, e.g. "E → E • + T" (with ", +/$" lookaheads for LR(1) items). */
export function itemText(item: LRItem, productions: LRProduction[]): string {
  const p = productions[item.production];
  const rhs = [...p.rhs];
  rhs.splice(item.dot, 0, '•');
  const la = item.lookaheads.length ? `, ${item.lookaheads.join('/')}` : '';
  return `${p.lhs} → ${rhs.join(' ')}${la}`;
}

export function actionText(a: LRAction): string {
  return a.type === 'shift' ? `s${a.state}` : a.type === 'reduce' ? `r${a.production}` : 'acc';
}

// --- Simulation ------------------------------------------------------------------------------

export interface LRStep {
  /** State stack with the grammar symbol that led to each state (none for the bottom state) */
  stack: { state: number; symbol?: string }[];
  remainingInput: string[];
  lookahead: string;
  status: 'SHIFT' | 'REDUCE' | 'ACCEPT' | 'ERROR';
  description: string;
  cell?: { state: number; symbol: string };
  production?: number;
}

export interface LRSimulation {
  steps: LRStep[];
  /** Finished subtrees (one root after a successful parse) */
  roots: ParseTreeNode[];
  /** For each step, the most recently built tree node (highlighted) */
  activeNodeByStep: (string | null)[];
}

/**
 * Shift-reduce parse driven by the table. Conflicting cells are resolved the way yacc does
 * (prefer shift; among reductions, the earliest production) and the step says so. The parse tree
 * is built bottom-up: shifts create leaves, reductions create the parent of the popped subtrees.
 */
export function simulateLR(table: LRTable, grammar: Grammar, input: string, maxSteps = 500): LRSimulation {
  const tokens = [...tokenizeInput(input, grammar.terminals), END_MARKER];
  const stack: LRStep['stack'] = [{ state: 0 }];
  const nodes: ParseTreeNode[] = [];
  const steps: LRStep[] = [];
  const activeNodeByStep: (string | null)[] = [];
  let lastNode: string | null = null;
  let pos = 0;
  let counter = 0;
  const make = (symbol: string, kind: ParseTreeNode['kind'], step: number, children: ParseTreeNode[] = []): ParseTreeNode => {
    const node = { id: `lr${counter++}`, symbol, kind, children, createdAtStep: step, doneAtStep: step };
    lastNode = node.id;
    return node;
  };

  while (steps.length < maxSteps) {
    const index = steps.length;
    const state = stack[stack.length - 1].state;
    const lookahead = tokens[pos];
    const cell = table.action[state]?.[lookahead] ?? [];
    const base = {
      stack: stack.map((e) => ({ ...e })),
      remainingInput: tokens.slice(pos),
      lookahead,
      cell: { state, symbol: lookahead },
    };
    activeNodeByStep.push(lastNode);

    if (cell.length === 0) {
      steps.push({ ...base, status: 'ERROR', description: `Syntax error: no action for state ${state} on '${lookahead}'.` });
      break;
    }
    const chosen =
      cell.find((a) => a.type === 'shift') ??
      cell.find((a) => a.type === 'accept') ??
      [...cell].sort((a, b) => (a.type === 'reduce' && b.type === 'reduce' ? a.production - b.production : 0))[0];
    const note = cell.length > 1 ? ` (conflict: ${cell.map(actionText).join(' / ')}; chose ${actionText(chosen)})` : '';

    if (chosen.type === 'accept') {
      steps.push({ ...base, status: 'ACCEPT', description: `Accept! Input parsed.${note}` });
      break;
    }
    if (chosen.type === 'shift') {
      steps.push({ ...base, status: 'SHIFT', description: `Shift '${lookahead}' and go to state ${chosen.state}.${note}` });
      nodes.push(make(lookahead, 'terminal', index + 1));
      stack.push({ state: chosen.state, symbol: lookahead });
      pos++;
      continue;
    }

    const p = table.productions[chosen.production];
    const popped = p.rhs.length;
    const below = stack[stack.length - 1 - popped].state;
    const target = table.goto[below]?.[p.lhs];
    steps.push({
      ...base,
      status: 'REDUCE',
      production: p.index,
      description: `Reduce by ${productionText(p)}: pop ${popped} state${popped === 1 ? '' : 's'}, goto(${below}, ${p.lhs}) = ${target ?? '—'}.${note}`,
    });
    const children = popped > 0 ? nodes.splice(nodes.length - popped, popped) : [make(EPSILON, 'epsilon', index + 1)];
    stack.splice(stack.length - popped, popped);
    nodes.push(make(p.lhs, 'nonterminal', index + 1, children));
    if (target === undefined) {
      steps.push({
        stack: stack.map((e) => ({ ...e })),
        remainingInput: tokens.slice(pos),
        lookahead,
        status: 'ERROR',
        description: `No goto from state ${below} on ${p.lhs}.`,
      });
      activeNodeByStep.push(lastNode);
      break;
    }
    stack.push({ state: target, symbol: p.lhs });
  }

  const last = steps[steps.length - 1];
  if (last && last.status !== 'ACCEPT' && last.status !== 'ERROR') {
    steps.push({
      stack: stack.map((e) => ({ ...e })),
      remainingInput: tokens.slice(pos),
      lookahead: tokens[pos],
      status: 'ERROR',
      description: `Step limit (${maxSteps}) exceeded.`,
    });
    activeNodeByStep.push(lastNode);
  }

  return { steps, roots: nodes, activeNodeByStep };
}
