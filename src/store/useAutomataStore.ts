import { create } from 'zustand';
import { produce } from 'immer';
import type { AutomatonDefinition, DFAConfig, ExecutionStep } from '../types/automata';
import { simulateDFA, simulateNFA } from '../core/automata';

interface AutomataState {
  automaton: AutomatonDefinition;
  testInput: string;
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;

  // Time-Travel Reducers
  setAutomaton: (def: AutomatonDefinition) => void;
  setTestInput: (input: string) => void;
  runSimulation: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  setStepIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeedMs: (speedMs: number) => void;
}

const defaultDFA: DFAConfig = {
  id: 'dfa-even-zeros',
  name: 'DFA - Binary Strings with Even Zeros',
  type: 'DFA',
  alphabet: ['0', '1'],
  startStateId: 'q0',
  acceptStateIds: ['q0'],
  states: [
    { id: 'q0', label: 'q0', isStart: true, isAccept: true, x: 150, y: 200 },
    { id: 'q1', label: 'q1', isStart: false, isAccept: false, x: 450, y: 200 },
  ],
  transitions: [
    { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
    { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
    { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
    { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
  ],
};

const initialSteps = simulateDFA(defaultDFA, '10010');

export const useAutomataStore = create<AutomataState>((set) => ({
  automaton: defaultDFA,
  testInput: '10010',
  executionSteps: initialSteps,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeedMs: 800,

  runSimulation: () =>
    set(
      produce((draft: AutomataState) => {
        const { automaton, testInput } = draft;
        if (automaton.type === 'DFA') {
          draft.executionSteps = simulateDFA(automaton as DFAConfig, testInput);
        } else if (automaton.type === 'NFA') {
          draft.executionSteps = simulateNFA(automaton, testInput);
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  setAutomaton: (def) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton = def;
        if (def.type === 'DFA') {
          draft.executionSteps = simulateDFA(def as DFAConfig, draft.testInput);
        } else if (def.type === 'NFA') {
          draft.executionSteps = simulateNFA(def, draft.testInput);
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  setTestInput: (input) =>
    set(
      produce((draft: AutomataState) => {
        draft.testInput = input;
        const { automaton } = draft;
        if (automaton.type === 'DFA') {
          draft.executionSteps = simulateDFA(automaton as DFAConfig, input);
        } else if (automaton.type === 'NFA') {
          draft.executionSteps = simulateNFA(automaton, input);
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  stepForward: () =>
    set(
      produce((draft: AutomataState) => {
        if (draft.currentStepIndex < draft.executionSteps.length - 1) {
          draft.currentStepIndex += 1;
        } else {
          draft.isPlaying = false;
        }
      })
    ),

  stepBackward: () =>
    set(
      produce((draft: AutomataState) => {
        if (draft.currentStepIndex > 0) {
          draft.currentStepIndex -= 1;
        }
      })
    ),

  reset: () =>
    set(
      produce((draft: AutomataState) => {
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  setStepIndex: (index) =>
    set(
      produce((draft: AutomataState) => {
        if (index >= 0 && index < draft.executionSteps.length) {
          draft.currentStepIndex = index;
        }
      })
    ),

  setIsPlaying: (playing) =>
    set(
      produce((draft: AutomataState) => {
        draft.isPlaying = playing;
      })
    ),

  setPlaybackSpeedMs: (speedMs) =>
    set(
      produce((draft: AutomataState) => {
        draft.playbackSpeedMs = speedMs;
      })
    ),
}));
