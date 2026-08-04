import { create } from 'zustand';
import { produce } from 'immer';
import type { AutomatonDefinition, ExecutionStep } from '../types/automata';

interface AutomataState {
  automaton: AutomatonDefinition;
  testInput: string;
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;

  // Actions
  setAutomaton: (def: AutomatonDefinition) => void;
  setTestInput: (input: string) => void;
  addState: (state: AutomatonDefinition['states'][0]) => void;
  addTransition: (transition: AutomatonDefinition['transitions'][0]) => void;
  setExecutionSteps: (steps: ExecutionStep[]) => void;
  setStepIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  resetExecution: () => void;
}

const defaultAutomaton: AutomatonDefinition = {
  id: 'dfa-even-zeros',
  name: 'DFA - Binary Strings with Even Zeros',
  type: 'DFA',
  alphabet: ['0', '1'],
  startStateId: 'q0',
  acceptStateIds: ['q0'],
  states: [
    { id: 'q0', label: 'q0', isStart: true, isAccept: true, x: 100, y: 150 },
    { id: 'q1', label: 'q1', isStart: false, isAccept: false, x: 300, y: 150 },
  ],
  transitions: [
    { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
    { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
    { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
    { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
  ],
};

export const useAutomataStore = create<AutomataState>((set) => ({
  automaton: defaultAutomaton,
  testInput: '10010',
  executionSteps: [],
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeedMs: 800,

  setAutomaton: (def) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton = def;
      })
    ),

  setTestInput: (input) =>
    set(
      produce((draft: AutomataState) => {
        draft.testInput = input;
      })
    ),

  addState: (newState) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton.states.push(newState);
      })
    ),

  addTransition: (newTransition) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton.transitions.push(newTransition);
      })
    ),

  setExecutionSteps: (steps) =>
    set(
      produce((draft: AutomataState) => {
        draft.executionSteps = steps;
        draft.currentStepIndex = 0;
      })
    ),

  setStepIndex: (index) =>
    set(
      produce((draft: AutomataState) => {
        draft.currentStepIndex = index;
      })
    ),

  setIsPlaying: (playing) =>
    set(
      produce((draft: AutomataState) => {
        draft.isPlaying = playing;
      })
    ),

  resetExecution: () =>
    set(
      produce((draft: AutomataState) => {
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),
}));
