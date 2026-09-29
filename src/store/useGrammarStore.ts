import { create } from 'zustand';
import type {
  Grammar,
  LL1Table,
  LL1ExecutionStep,
} from '../types/cfg';
import {
  parseGrammarText,
  calculateFirstSets,
  calculateFollowSets,
} from '../core/compiler/cfgEngine';
import { generateLL1Table, simulateLL1 } from '../core/compiler/ll1Parser';
import { buildLL1ParseTree, type ParseTreeResult } from '../core/compiler/parseTree';
import { createPlaybackSlice, type PlaybackState } from './playback';

export interface GrammarPreset {
  id: string;
  name: string;
  grammarText: string;
  testInput: string;
}

export const PRESET_GRAMMARS: GrammarPreset[] = [
  {
    id: 'arithmetic',
    name: 'Arithmetic Grammar (Left-Factored)',
    grammarText: `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`,
    testInput: 'id + id * id',
  },
  {
    id: 'simple_ab',
    name: 'Simple S -> A B',
    grammarText: `S -> A B | c
A -> a A | ε
B -> b`,
    testInput: 'a a b',
  },
  {
    id: 'parens',
    name: 'Nested Parentheses',
    grammarText: `S -> ( S ) S | ε`,
    testInput: '( ( ) )',
  },
];

interface GrammarState extends PlaybackState {
  grammarText: string;
  testInput: string;
  grammar: Grammar;
  firstSets: Record<string, string[]>;
  followSets: Record<string, string[]>;
  ll1Table: LL1Table;
  executionSteps: LL1ExecutionStep[];
  /** Parse tree built from the LL(1) trace, revealed step by step */
  parseTree: ParseTreeResult;
  parseError: string | null;

  setGrammarText: (text: string) => void;
  setTestInput: (input: string) => void;
  loadPreset: (presetId: string) => void;
  recompute: () => void;
}

const defaultPreset = PRESET_GRAMMARS[0];

function computeGrammarState(grammarText: string, testInput: string) {
  const grammar = parseGrammarText(grammarText);

  let parseError: string | null = null;
  if (grammar.nonTerminals.length === 0) {
    parseError = 'No valid production rules found.';
  }

  const rawFirstSets = calculateFirstSets(grammar);
  const rawFollowSets = calculateFollowSets(grammar, rawFirstSets);

  // Convert Sets to sorted Arrays for React UI
  const firstSets: Record<string, string[]> = {};
  for (const [key, setVal] of Object.entries(rawFirstSets)) {
    firstSets[key] = Array.from(setVal).sort();
  }

  const followSets: Record<string, string[]> = {};
  for (const [key, setVal] of Object.entries(rawFollowSets)) {
    followSets[key] = Array.from(setVal).sort();
  }

  const ll1Table = generateLL1Table(grammar, rawFirstSets, rawFollowSets);

  return {
    grammarText,
    grammar,
    firstSets,
    followSets,
    ll1Table,
    parseError,
    ...computeParse(grammar, ll1Table, testInput),
  };
}

/** The parts that depend on the test input: the LL(1) trace and its parse tree. */
function computeParse(grammar: Grammar, ll1Table: LL1Table, testInput: string) {
  const executionSteps = simulateLL1(grammar, ll1Table, testInput);
  return {
    testInput,
    executionSteps,
    parseTree: buildLL1ParseTree(executionSteps, grammar),
    currentStepIndex: 0,
    isPlaying: false,
  };
}

const initialComputed = computeGrammarState(defaultPreset.grammarText, defaultPreset.testInput);

export const useGrammarStore = create<GrammarState>((set, get) => ({
  ...createPlaybackSlice<GrammarState>(set, (state) => state.executionSteps.length),
  ...initialComputed,

  setGrammarText: (text: string) => set(computeGrammarState(text, get().testInput)),

  setTestInput: (input: string) => set(computeParse(get().grammar, get().ll1Table, input)),

  loadPreset: (presetId: string) => {
    const preset = PRESET_GRAMMARS.find((p) => p.id === presetId);
    if (preset) set(computeGrammarState(preset.grammarText, preset.testInput));
  },

  recompute: () => set(computeGrammarState(get().grammarText, get().testInput)),
}));
