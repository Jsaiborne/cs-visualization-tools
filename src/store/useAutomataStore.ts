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
import { isEpsilon } from '../core/epsilon';
import { createPlaybackSlice, type PlaybackState } from './playback';

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

/**
 * Re-validates the automaton and rebuilds the execution trace from scratch.
 * Every mutation that can change the trace must call this so the step index never
 * points past the end of a shorter trace or at steps from a stale machine.
 */
function recompute(draft: AutomataState) {
  draft.validationErrors = validateAutomaton(draft.automaton);
  draft.executionSteps =
    draft.validationErrors.length === 0 ? computeSimulationSteps(draft.automaton, draft.testInput) : [];
  draft.currentStepIndex = 0;
  draft.isPlaying = false;
}

/** Smallest `qN` id not already used by a state. */
function nextStateId(states: StateNode[]): string {
  const used = new Set(states.map((s) => s.id));
  let n = 0;
  while (used.has(`q${n}`)) n++;
  return `q${n}`;
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

interface AutomataState extends PlaybackState {
  automaton: AutomatonDefinition;
  testInput: string;
  executionSteps: ExecutionStep[];
  validationErrors: string[];

  // Time-Travel Reducers
  setAutomaton: (def: AutomatonDefinition) => void;
  setTestInput: (input: string) => void;
  runSimulation: () => void;

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

export const defaultDFA: DFAConfig = {
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
  ...createPlaybackSlice<AutomataState>(set, (state) => state.executionSteps.length),
  automaton: defaultDFA,
  testInput: '10010',
  executionSteps: initialSteps,
  validationErrors: initialErrors,

  runSimulation: () => set(produce((draft: AutomataState) => recompute(draft))),

  setAutomaton: (def) =>
    set(
      produce((draft: AutomataState) => {
        draft.automaton = def;
        recompute(draft);
      })
    ),

  setTestInput: (input) =>
    set(
      produce((draft: AutomataState) => {
        draft.testInput = input;
        recompute(draft);
      })
    ),

  // Builder Actions
  addState: (customId, x = 250, y = 200) =>
    set(
      produce((draft: AutomataState) => {
        const states = draft.automaton.states;
        const newId = customId && !states.some((s) => s.id === customId) ? customId : nextStateId(states);
        const isFirst = states.length === 0;

        states.push({
          id: newId,
          label: newId,
          isStart: isFirst,
          isAccept: false,
          x,
          y,
        });
        if (isFirst) {
          draft.automaton.startStateId = newId;
        }
        recompute(draft);
      })
    ),

  removeElement: (id) =>
    set(
      produce((draft: AutomataState) => {
        const automaton = draft.automaton;
        const stateIdx = automaton.states.findIndex((s) => s.id === id);

        if (stateIdx !== -1) {
          automaton.states.splice(stateIdx, 1);

          if (automaton.type === 'TM') {
            automaton.transitions = automaton.transitions.filter(
              (t) => t.fromState !== id && t.nextState !== id
            );
            if (automaton.acceptStateId === id) automaton.acceptStateId = '';
            if (automaton.rejectStateId === id) automaton.rejectStateId = undefined;
          } else {
            automaton.transitions = automaton.transitions.filter((t) => t.from !== id && t.to !== id);
            automaton.acceptStateIds = automaton.acceptStateIds.filter((accId) => accId !== id);
          }

          if (automaton.startStateId === id) {
            automaton.startStateId = automaton.states[0]?.id || '';
            automaton.states.forEach((s) => {
              s.isStart = s.id === automaton.startStateId;
            });
          }
        } else if (automaton.type === 'TM') {
          automaton.transitions = automaton.transitions.filter((r) => r.id !== id);
        } else {
          // Not a state: treat the id as an edge
          automaton.transitions = automaton.transitions.filter((t) => t.id !== id);
        }

        recompute(draft);
      })
    ),

  addEdge: (source, target, symbolInput) =>
    set(
      produce((draft: AutomataState) => {
        const automaton = draft.automaton;
        if (automaton.type === 'TM') return;

        // "0, 1" creates one edge per symbol
        const symbols = Array.from(
          new Set(symbolInput.split(',').map((sym) => sym.trim()).filter(Boolean))
        );

        for (const symbol of symbols) {
          if (automaton.type === 'DFA') {
            // A DFA has at most one edge per (state, symbol): replace any existing one
            automaton.transitions = automaton.transitions.filter(
              (t) => !(t.from === source && t.symbol === symbol)
            );
          } else if (automaton.transitions.some((t) => t.from === source && t.to === target && t.symbol === symbol)) {
            continue;
          }

          automaton.transitions.push({
            id: `t_${source}_${target}_${symbol}_${Date.now()}`,
            from: source,
            to: target,
            symbol,
          });

          if (!isEpsilon(symbol) && !automaton.alphabet.includes(symbol)) {
            automaton.alphabet.push(symbol);
          }
        }

        recompute(draft);
      })
    ),

  toggleAcceptState: (id) =>
    set(
      produce((draft: AutomataState) => {
        const automaton = draft.automaton;
        const state = automaton.states.find((s) => s.id === id);
        if (!state) return;

        state.isAccept = !state.isAccept;
        if (automaton.type === 'TM') {
          // A TM has exactly one accept state
          if (state.isAccept) {
            automaton.states.forEach((s) => {
              if (s.id !== id) s.isAccept = false;
            });
            automaton.acceptStateId = id;
          } else if (automaton.acceptStateId === id) {
            automaton.acceptStateId = '';
          }
        } else if (state.isAccept) {
          if (!automaton.acceptStateIds.includes(id)) automaton.acceptStateIds.push(id);
        } else {
          automaton.acceptStateIds = automaton.acceptStateIds.filter((accId) => accId !== id);
        }

        recompute(draft);
      })
    ),

  setStartState: (id) =>
    set(
      produce((draft: AutomataState) => {
        if (!draft.automaton.states.some((s) => s.id === id)) return;
        draft.automaton.startStateId = id;
        draft.automaton.states.forEach((s) => {
          s.isStart = s.id === id;
        });
        recompute(draft);
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
        const tm = draft.automaton;
        const newRule: TMTransitionRule = {
          ...rule,
          id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        recompute(draft);
      })
    ),

  removeTMRule: (ruleId) =>
    set(
      produce((draft: AutomataState) => {
        if (draft.automaton.type !== 'TM') return;
        draft.automaton.transitions = draft.automaton.transitions.filter((r) => r.id !== ruleId);
        recompute(draft);
      })
    ),
}));
