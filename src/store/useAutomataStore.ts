import { create } from 'zustand';
import { produce } from 'immer';
import type {
  AutomatonDefinition,
  DFAConfig,
  NFAConfig,
  TMConfig,
  TMTransitionRule,
  ExecutionStep,
  StateNode,
} from '../types/automata';
import { simulateDFA, simulateNFA } from '../core/automata';
import { simulateTM } from '../core/automata/turingMachine';

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

  // 2. TM Specific Validation
  if (automaton.type === 'TM') {
    const tm = automaton as TMConfig;
    if (!tm.acceptStateId) {
      errors.push('Turing Machine requires an Accept state.');
    }
    if (!tm.transitions || tm.transitions.length === 0) {
      errors.push('Turing Machine requires at least one transition rule.');
    }
    return errors;
  }

  // 3. Check accept states for DFA / NFA
  const dfaOrNfa = automaton as DFAConfig | NFAConfig;
  if (!dfaOrNfa.acceptStateIds || dfaOrNfa.acceptStateIds.length === 0) {
    errors.push('Automaton requires at least one Accept state.');
  } else {
    for (const accId of dfaOrNfa.acceptStateIds) {
      if (!automaton.states.some((s) => s.id === accId)) {
        errors.push(`Accept state '${accId}' is missing from states.`);
      }
    }
  }

  // 4. DFA Determinism & Completeness Validation
  if (automaton.type === 'DFA') {
    const dfa = automaton as DFAConfig;
    const alphabet = dfa.alphabet || [];
    const stateMap = new Map<string, Set<string>>();

    for (const s of dfa.states) {
      stateMap.set(s.id, new Set());
    }

    for (const t of dfa.transitions) {
      if (!dfa.states.some((s) => s.id === t.from)) {
        errors.push(`Transition references unknown source state '${t.from}'.`);
      }
      if (!dfa.states.some((s) => s.id === t.to)) {
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
      for (const s of dfa.states) {
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

function computeSimulationSteps(automaton: AutomatonDefinition, input: string): ExecutionStep[] {
  if (automaton.type === 'DFA') {
    return simulateDFA(automaton as DFAConfig, input);
  } else if (automaton.type === 'NFA') {
    return simulateNFA(automaton as NFAConfig, input);
  } else if (automaton.type === 'TM') {
    return simulateTM(automaton as TMConfig, input);
  }
  return [];
}

export const defaultTM: TMConfig = {
  id: 'tm-bit-flipper',
  name: 'Turing Machine - Bit Flipper (Invert 0/1)',
  type: 'TM',
  alphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', 'B'],
  startStateId: 'q0',
  acceptStateId: 'q_accept',
  rejectStateId: 'q_reject',
  blankSymbol: 'B',
  states: [
    { id: 'q0', label: 'q0', isStart: true, isAccept: false, x: 200, y: 200 },
    { id: 'q_accept', label: 'q_accept', isStart: false, isAccept: true, x: 550, y: 200 },
    { id: 'q_reject', label: 'q_reject', isStart: false, isAccept: false, isReject: true, x: 375, y: 350 },
  ],
  transitions: [
    { id: 'rule-1', fromState: 'q0', read: '1', write: '0', move: 'R', nextState: 'q0' },
    { id: 'rule-2', fromState: 'q0', read: '0', write: '1', move: 'R', nextState: 'q0' },
    { id: 'rule-3', fromState: 'q0', read: 'B', write: 'B', move: 'N', nextState: 'q_accept' },
  ],
};

export const binaryIncrementerTM: TMConfig = {
  id: 'tm-binary-incrementer',
  name: 'Turing Machine - Binary Incrementer (+1)',
  type: 'TM',
  alphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', 'B'],
  startStateId: 'q_scan_right',
  acceptStateId: 'q_accept',
  rejectStateId: 'q_reject',
  blankSymbol: 'B',
  states: [
    { id: 'q_scan_right', label: 'q_scan_right', isStart: true, isAccept: false, x: 150, y: 200 },
    { id: 'q_carry', label: 'q_carry', isStart: false, isAccept: false, x: 380, y: 200 },
    { id: 'q_accept', label: 'q_accept', isStart: false, isAccept: true, x: 600, y: 200 },
  ],
  transitions: [
    { id: 'inc-1', fromState: 'q_scan_right', read: '0', write: '0', move: 'R', nextState: 'q_scan_right' },
    { id: 'inc-2', fromState: 'q_scan_right', read: '1', write: '1', move: 'R', nextState: 'q_scan_right' },
    { id: 'inc-3', fromState: 'q_scan_right', read: 'B', write: 'B', move: 'L', nextState: 'q_carry' },
    { id: 'inc-4', fromState: 'q_carry', read: '1', write: '0', move: 'L', nextState: 'q_carry' },
    { id: 'inc-5', fromState: 'q_carry', read: '0', write: '1', move: 'N', nextState: 'q_accept' },
    { id: 'inc-6', fromState: 'q_carry', read: 'B', write: '1', move: 'N', nextState: 'q_accept' },
  ],
};

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

  // Builder Drag-and-Drop & TM Mutation Actions
  addState: (id?: string, x?: number, y?: number) => void;
  removeElement: (id: string) => void;
  addEdge: (source: string, target: string, symbol: string) => void;
  toggleAcceptState: (id: string) => void;
  setStartState: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  addTMRule: (rule: Omit<TMTransitionRule, 'id'>) => void;
  removeTMRule: (ruleId: string) => void;
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
const initialSteps = initialErrors.length === 0 ? computeSimulationSteps(defaultDFA, '10010') : [];

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
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
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
          draft.executionSteps = computeSimulationSteps(def, draft.testInput);
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
          draft.executionSteps = computeSimulationSteps(draft.automaton, input);
        }
        draft.currentStepIndex = 0;
        draft.isPlaying = false;
      })
    ),

  stepForward: () =>
    set(
      produce((draft: AutomataState) => {
        if (draft.executionSteps.length > 0 && draft.currentStepIndex < draft.executionSteps.length - 1) {
          draft.currentStepIndex += 1;
        } else {
          draft.isPlaying = false;
        }
      })
    ),

  stepBackward: () =>
    set(
      produce((draft: AutomataState) => {
        if (draft.executionSteps.length > 0 && draft.currentStepIndex > 0) {
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

  // Builder Actions
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
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
        } else {
          draft.executionSteps = [];
        }
      })
    ),

  removeElement: (id) =>
    set(
      produce((draft: AutomataState) => {
        const stateIdx = draft.automaton.states.findIndex((s) => s.id === id);
        if (stateIdx !== -1) {
          draft.automaton.states.splice(stateIdx, 1);
          if (draft.automaton.type !== 'TM') {
            const dfaOrNfa = draft.automaton as DFAConfig | NFAConfig;
            dfaOrNfa.transitions = dfaOrNfa.transitions.filter(
              (t) => t.from !== id && t.to !== id
            );
          } else {
            const tm = draft.automaton as TMConfig;
            tm.transitions = tm.transitions.filter(
              (t) => t.fromState !== id && t.nextState !== id
            );
          }

          if (draft.automaton.startStateId === id) {
            draft.automaton.startStateId = draft.automaton.states[0]?.id || '';
            draft.automaton.states.forEach((s) => {
              s.isStart = s.id === draft.automaton.startStateId;
            });
          }
        }
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
        } else {
          draft.executionSteps = [];
        }
        draft.currentStepIndex = 0;
      })
    ),

  addEdge: (source, target, symbol) =>
    set(
      produce((draft: AutomataState) => {
        if (draft.automaton.type === 'TM') return;
        const edgeId = `t_${source}_${target}_${symbol}_${Date.now()}`;
        if (draft.automaton.type === 'DFA') {
          draft.automaton.transitions = draft.automaton.transitions.filter(
            (t) => !(t.from === source && t.symbol === symbol)
          );
        }
        draft.automaton.transitions.push({
          id: edgeId,
          from: source,
          to: target,
          symbol,
        });
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
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
          if (draft.automaton.type === 'TM') {
            const tm = draft.automaton as TMConfig;
            if (state.isAccept) tm.acceptStateId = id;
          } else {
            const dfaOrNfa = draft.automaton as DFAConfig | NFAConfig;
            if (state.isAccept) {
              if (!dfaOrNfa.acceptStateIds.includes(id)) dfaOrNfa.acceptStateIds.push(id);
            } else {
              dfaOrNfa.acceptStateIds = dfaOrNfa.acceptStateIds.filter((accId) => accId !== id);
            }
          }
          draft.validationErrors = validateAutomaton(draft.automaton);
          if (draft.validationErrors.length === 0) {
            draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
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
            draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
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

  addTMRule: (rule) =>
    set(
      produce((draft: AutomataState) => {
        if (draft.automaton.type !== 'TM') return;
        const tm = draft.automaton as TMConfig;
        const newRule: TMTransitionRule = {
          ...rule,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        };
        // Overwrite rule for same (fromState, read) if exists
        const existingIdx = tm.transitions.findIndex(
          (r) => r.fromState === rule.fromState && r.read === rule.read
        );
        if (existingIdx !== -1) {
          tm.transitions[existingIdx] = newRule;
        } else {
          tm.transitions.push(newRule);
        }
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
        }
      })
    ),

  removeTMRule: (ruleId) =>
    set(
      produce((draft: AutomataState) => {
        if (draft.automaton.type !== 'TM') return;
        const tm = draft.automaton as TMConfig;
        tm.transitions = tm.transitions.filter((r) => r.id !== ruleId);
        draft.validationErrors = validateAutomaton(draft.automaton);
        if (draft.validationErrors.length === 0) {
          draft.executionSteps = computeSimulationSteps(draft.automaton, draft.testInput);
        }
      })
    ),
}));
