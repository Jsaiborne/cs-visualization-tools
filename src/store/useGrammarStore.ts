import { create } from 'zustand';
import { produce } from 'immer';
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

interface GrammarState {
  grammarText: string;
  testInput: string;
  grammar: Grammar;
  firstSets: Record<string, string[]>;
  followSets: Record<string, string[]>;
  ll1Table: LL1Table;
  executionSteps: LL1ExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  parseError: string | null;

  setGrammarText: (text: string) => void;
  setTestInput: (input: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeedMs: (speed: number) => void;
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
  const executionSteps = simulateLL1(grammar, ll1Table, testInput);

  return {
    grammarText,
    testInput,
    grammar,
    firstSets,
    followSets,
    ll1Table,
    executionSteps,
    currentStepIndex: 0,
    parseError,
  };
}

const initialComputed = computeGrammarState(defaultPreset.grammarText, defaultPreset.testInput);

export const useGrammarStore = create<GrammarState>((set, get) => ({
  ...initialComputed,
  isPlaying: false,
  playbackSpeedMs: 800,

  setGrammarText: (text: string) => {
    set(
      produce((draft: GrammarState) => {
        const computed = computeGrammarState(text, draft.testInput);
        draft.grammarText = computed.grammarText;
        draft.grammar = computed.grammar;
        draft.firstSets = computed.firstSets;
        draft.followSets = computed.followSets;
        draft.ll1Table = computed.ll1Table;
        draft.executionSteps = computed.executionSteps;
        draft.currentStepIndex = 0;
        draft.parseError = computed.parseError;
        draft.isPlaying = false;
      })
    );
  },

  setTestInput: (input: string) => {
    set(
      produce((draft: GrammarState) => {
        draft.testInput = input;
        const steps = simulateLL1(draft.grammar, draft.ll1Table, input);
        draft.executionSteps = steps;
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    );
  },

  stepForward: () => {
    set((state) => {
      if (state.currentStepIndex < state.executionSteps.length - 1) {
        return { currentStepIndex: state.currentStepIndex + 1 };
      }
      return { isPlaying: false };
    });
  },

  stepBackward: () => {
    set((state) => {
      if (state.currentStepIndex > 0) {
        return { currentStepIndex: state.currentStepIndex - 1 };
      }
      return {};
    });
  },

  reset: () => {
    set({ currentStepIndex: 0, isPlaying: false });
  },

  setIsPlaying: (isPlaying: boolean) => {
    set({ isPlaying });
  },

  setPlaybackSpeedMs: (playbackSpeedMs: number) => {
    set({ playbackSpeedMs });
  },

  loadPreset: (presetId: string) => {
    const preset = PRESET_GRAMMARS.find((p) => p.id === presetId);
    if (!preset) return;
    set(
      produce((draft: GrammarState) => {
        const computed = computeGrammarState(preset.grammarText, preset.testInput);
        draft.grammarText = computed.grammarText;
        draft.testInput = computed.testInput;
        draft.grammar = computed.grammar;
        draft.firstSets = computed.firstSets;
        draft.followSets = computed.followSets;
        draft.ll1Table = computed.ll1Table;
        draft.executionSteps = computed.executionSteps;
        draft.currentStepIndex = 0;
        draft.parseError = computed.parseError;
        draft.isPlaying = false;
      })
    );
  },

  recompute: () => {
    const { grammarText, testInput } = get();
    set(
      produce((draft: GrammarState) => {
        const computed = computeGrammarState(grammarText, testInput);
        draft.grammar = computed.grammar;
        draft.firstSets = computed.firstSets;
        draft.followSets = computed.followSets;
        draft.ll1Table = computed.ll1Table;
        draft.executionSteps = computed.executionSteps;
        draft.currentStepIndex = 0;
        draft.parseError = computed.parseError;
      })
    );
  },
}));
