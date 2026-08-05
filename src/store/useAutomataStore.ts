import { create } from 'zustand';
import { produce } from 'immer';
import type { AutomatonDefinition, DFAConfig, ExecutionStep, StateNode, TransitionEdge } from '../types/automata';
import { simulateDFA, simulateNFA } from '../core/automata';

export function validateAutomaton(automaton: AutomatonDefinition): string[] {
  const errors: string[] = [];

  // 1. Check start state
  if (!automaton.startStateId) {
    errors.push('Automaton requires a designated Start state.');
  } else {
    const startExists = automaton.states.some((s) => s.id === automaton.startStateId);
    if (!startExists) {
      errors.push(`Start state '${automaton.startStateId}' is missing.`);
    }
  }

  // 2. Check accept states
  if (!automaton.acceptStateIds || automaton.acceptStateIds.length === 0) {
    errors.push('Automaton requires at least one Accept state.');
  } else {
    for (const accId of automaton.acceptStateIds) {
      if (!automaton.states.some((s) => s.id === accId)) {
        errors.push(`Accept state '${accId}' is missing from states.`);
      }
    }
  }

  // 3. DFA Determinism & Completeness Validation
  if (automaton.type === 'DFA') {
    const alphabet = automaton.alphabet || [];
    const stateMap = new Map<string, Set<string>>();

    for (const s of automaton.states) {
      stateMap.set(s.id, new Set());
    }

    for (const t of automaton.transitions) {
      if (!automaton.states.some((s) => s.id === t.from)) {
        errors.push(`Transition references unknown source state '${t.from}'.`);
      }
      if (!automaton.states.some((s) => s.id === t.to)) {
        errors.push(`Transition references unknown target state '${t.to}'.`);
      }
      if (alphabet.length > 0 && !alphabet.includes(t.symbol)) {
        errors.push(`Transition '${t.from} -> ${t.to}' uses symbol '${t.symbol}' not in alphabet.`);
      }

      const handled = stateMap.get(t.from);
      if (handled) {
        if (handled.has(t.symbol)) {
          errors.push(`Non-Deterministic: State '${t.from}' has multiple transitions for symbol '${t.symbol}'.`);
        }
        handled.add(t.symbol);
      }
    }

    // Completeness check
    if (alphabet.length > 0) {
      for (const s of automaton.states) {
        const handled = stateMap.get(s.id) || new Set();
        const missing = alphabet.filter((sym) => !handled.has(sym));
        if (missing.length > 0) {
          errors.push(`State '${s.id}' missing transition for '${missing.join("', '")}'.`);
        }
      }
    }
  }

  return errors;
}

interface AutomataState {
  automaton: AutomatonDefinition;
  testInput: string;
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  validationErrors: string[];

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

  // Builder Drag-and-Drop Mutation Actions
  addState: (id?: string, x?: number, y?: number) => void;
  removeElement: (id: string) => void;
  addEdge: (source: string, target: string, symbol: string) => void;
  toggleAcceptState: (id: string) => void;
  setStartState: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
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

const initialErrors = validateAutomaton(defaultDFA);
const initialSteps = initialErrors.length === 0 ? simulateDFA(defaultDFA, '10010') : [];

export const useAutomataStore = create<AutomataState>((set) => ({
  automaton: defaultDFA,
  testInput: '10010',
  executionSteps: initialSteps,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeedMs: 800,
  validationErrors: initialErrors,

  runSimulation: () =>
    set(
      produce((draft: AutomataState) => {
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          if (draft.automaton.type === 'DFA') {
            draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
          } else if (draft.automaton.type === 'NFA') {
            draft.executionSteps = simulateNFA(draft.automaton, draft.testInput);
          }
        } else {
          draft.executionSteps = [];
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  setAutomaton: (def) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton = def;
        draft.validationErrors = validateAutomaton(def);
        if (draft.validationErrors.length === 0) {
          if (def.type === 'DFA') {
            draft.executionSteps = simulateDFA(def as DFAConfig, draft.testInput);
          } else if (def.type === 'NFA') {
            draft.executionSteps = simulateNFA(def, draft.testInput);
          }
        } else {
          draft.executionSteps = [];
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  setTestInput: (input) =>
    set(
      produce((draft: AutomataState) => {
        draft.testInput = input;
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          if (draft.automaton.type === 'DFA') {
            draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, input);
          } else if (draft.automaton.type === 'NFA') {
            draft.executionSteps = simulateNFA(draft.automaton, input);
          }
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

  // Builder Drag-and-Drop Actions
  addState: (customId, x = 250, y = 200) =>
    set(
      produce((draft: AutomataState) => {
        const count = draft.automaton.states.length;
        const newId = customId || `q${count}`;
        const isFirst = count === 0;

        const newState: StateNode = {
          id: newId,
          label: newId,
          isStart: isFirst,
          isAccept: false,
          x,
          y,
        };

        draft.automaton.states.push(newState);
        if (isFirst) {
          draft.automaton.startStateId = newId;
        }

        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
        } else {
          draft.executionSteps = [];
        }
      })
    ),

  removeElement: (id) =>
    set(
      produce((draft: AutomataState) => {
        // Check if removing a state
        const stateIdx = draft.automaton.states.findIndex((s) => s.id === id);
        if (stateIdx !== -1) {
          draft.automaton.states.splice(stateIdx, 1);
          // Remove connected transitions
          draft.automaton.transitions = draft.automaton.transitions.filter(
            (t) => t.from !== id && t.to !== id
          );

          // Update start state if removed
          if (draft.automaton.startStateId === id) {
            draft.automaton.startStateId = draft.automaton.states[0]?.id || '';
            draft.automaton.states.forEach((s) => {
              s.isStart = s.id === draft.automaton.startStateId;
            });
          }

          // Update accept states
          draft.automaton.acceptStateIds = draft.automaton.acceptStateIds.filter(
            (accId) => accId !== id
          );
        } else {
          // Check if removing an edge
          draft.automaton.transitions = draft.automaton.transitions.filter((t) => t.id !== id);
        }

        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
        } else {
          draft.executionSteps = [];
        }
        draft.currentStepIndex = 0;
      })
    ),

  addEdge: (source, target, symbol) =>
    set(
      produce((draft: AutomataState) => {
        const edgeId = `t_${source}_${target}_${symbol}_${Date.now()}`;
        
        // Remove duplicate transition if existing for DFA
        if (draft.automaton.type === 'DFA') {
          draft.automaton.transitions = draft.automaton.transitions.filter(
            (t) => !(t.from === source && t.symbol === symbol)
          );
        }

        const newTransition: TransitionEdge = {
          id: edgeId,
          from: source,
          to: target,
          symbol,
        };

        draft.automaton.transitions.push(newTransition);

        // Ensure symbol is in alphabet
        if (!draft.automaton.alphabet.includes(symbol)) {
          draft.automaton.alphabet.push(symbol);
        }

        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
        } else {
          draft.executionSteps = [];
        }
      })
    ),

  toggleAcceptState: (id) =>
    set(
      produce((draft: AutomataState) => {
        const state = draft.automaton.states.find((s) => s.id === id);
        if (state) {
          state.isAccept = !state.isAccept;
          if (state.isAccept) {
            if (!draft.automaton.acceptStateIds.includes(id)) {
              draft.automaton.acceptStateIds.push(id);
            }
          } else {
            draft.automaton.acceptStateIds = draft.automaton.acceptStateIds.filter(
              (accId) => accId !== id
            );
          }

          draft.validationErrors = validateAutomaton(draft.automaton);
          if (draft.validationErrors.length === 0) {
            draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
          } else {
            draft.executionSteps = [];
          }
        }
      })
    ),

  setStartState: (id) =>
    set(
      produce((draft: AutomataState) => {
        const state = draft.automaton.states.find((s) => s.id === id);
        if (state) {
          draft.automaton.startStateId = id;
          draft.automaton.states.forEach((s) => {
            s.isStart = s.id === id;
          });

          draft.validationErrors = validateAutomaton(draft.automaton);
          if (draft.validationErrors.length === 0) {
            draft.executionSteps = simulateDFA(draft.automaton as DFAConfig, draft.testInput);
          } else {
            draft.executionSteps = [];
          }
        }
      })
    ),

  updateNodePosition: (id, x, y) =>
    set(
      produce((draft: AutomataState) => {
        const state = draft.automaton.states.find((s) => s.id === id);
        if (state) {
          state.x = x;
          state.y = y;
        }
      })
    ),
}));
