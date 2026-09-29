import { create } from 'zustand';
import type { Grammar } from '../types/cfg';
import { parseGrammarText } from '../core/compiler/cfgEngine';
import { buildLRTable, simulateLR, type LRKind, type LRTable, type LRSimulation } from '../core/compiler/lrParser';
import { createPlaybackSlice, type PlaybackState } from './playback';

export const LR_KINDS: LRKind[] = ['LR0', 'SLR1', 'LALR1', 'CLR1'];

export interface LRPreset {
  id: string;
  name: string;
  grammarText: string;
  testInput: string;
  kind: LRKind;
  note: string;
}

export const LR_PRESETS: LRPreset[] = [
  {
    id: 'arith',
    name: 'Arithmetic (left-recursive)',
    grammarText: `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`,
    testInput: 'id + id * id',
    kind: 'SLR1',
    note: 'Left recursion is fine for LR parsers (no transformation needed, unlike LL(1)). LR(0) has conflicts; SLR(1) resolves them.',
  },
  {
    id: 'lvalue',
    name: 'L = R (LALR, not SLR)',
    grammarText: `S -> L = R | R
L -> * R | id
R -> L`,
    testInput: 'id = * id',
    kind: 'LALR1',
    note: "SLR(1) reduces R → L on '=' because '=' ∈ FOLLOW(R), a shift/reduce conflict. LALR(1) lookaheads know better.",
  },
  {
    id: 'lalr-rr',
    name: 'LR(1), not LALR',
    grammarText: `S -> a A d | b B d | a B e | b A e
A -> c
B -> c`,
    testInput: 'a c e',
    kind: 'CLR1',
    note: 'Merging the two LR(1) states for "c •" (same core, different lookaheads) creates a reduce/reduce conflict in LALR(1).',
  },
  {
    id: 'parens',
    name: 'Balanced parentheses (LR(0))',
    grammarText: `S -> ( S ) | x`,
    testInput: '( ( x ) )',
    kind: 'LR0',
    note: 'Every state has either only shifts or a single reduction, so no lookahead is needed.',
  },
];

interface LRStoreState extends PlaybackState {
  grammarText: string;
  testInput: string;
  kind: LRKind;
  grammar: Grammar;
  table: LRTable;
  /** Number of conflicting cells for each method, so the selector can compare them */
  conflictCounts: Record<LRKind, number>;
  simulation: LRSimulation;
  parseError: string | null;

  setGrammarText: (text: string) => void;
  setTestInput: (input: string) => void;
  setKind: (kind: LRKind) => void;
  loadPreset: (presetId: string) => void;
}

function computeGrammar(grammarText: string, kind: LRKind, testInput: string) {
  const grammar = parseGrammarText(grammarText);
  const parseError = grammar.nonTerminals.length === 0 ? 'No valid production rules found.' : null;
  const tables = Object.fromEntries(LR_KINDS.map((k) => [k, buildLRTable(grammar, k)])) as Record<LRKind, LRTable>;
  return {
    grammarText,
    grammar,
    parseError,
    conflictCounts: Object.fromEntries(LR_KINDS.map((k) => [k, tables[k].conflicts.length])) as Record<LRKind, number>,
    ...computeRun(grammar, tables[kind], kind, testInput),
  };
}

function computeRun(grammar: Grammar, table: LRTable, kind: LRKind, testInput: string) {
  return {
    kind,
    table,
    testInput,
    simulation: simulateLR(table, grammar, testInput),
    currentStepIndex: 0,
    isPlaying: false,
  };
}

const initial = computeGrammar(LR_PRESETS[0].grammarText, LR_PRESETS[0].kind, LR_PRESETS[0].testInput);

export const useLRStore = create<LRStoreState>((set, get) => ({
  ...createPlaybackSlice<LRStoreState>(set, (state) => state.simulation.steps.length),
  ...initial,

  setGrammarText: (text) => set(computeGrammar(text, get().kind, get().testInput)),

  setTestInput: (input) => {
    const { grammar, table, kind } = get();
    set(computeRun(grammar, table, kind, input));
  },

  setKind: (kind) => {
    const { grammar, testInput } = get();
    set(computeRun(grammar, buildLRTable(grammar, kind), kind, testInput));
  },

  loadPreset: (presetId) => {
    const preset = LR_PRESETS.find((p) => p.id === presetId);
    if (preset) set(computeGrammar(preset.grammarText, preset.kind, preset.testInput));
  },
}));
