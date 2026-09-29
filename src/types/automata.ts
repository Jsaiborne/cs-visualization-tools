export type TMDirection = 'L' | 'R' | 'N';

export interface StateNode {
  id: string;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  isReject?: boolean;
  x?: number;
  y?: number;
}

export interface TransitionEdge {
  id: string;
  from: string;
  to: string;
  symbol: string; // 'a', 'b', 'ε', etc.
}

export interface TMTransitionRule {
  id: string;
  fromState: string;
  read: string;
  write: string;
  move: TMDirection;
  nextState: string;
}

// Transition Lookup Matrix / Adjacency List Map Types
export type DFATransitionTable = Record<string, Record<string, string>>; // stateId -> (symbol -> targetStateId)
export type NFATransitionTable = Record<string, Record<string, string[]>>; // stateId -> (symbol -> array of targetStateIds)

export interface DFAConfig {
  id: string;
  name: string;
  type: 'DFA';
  states: StateNode[];
  alphabet: string[];
  transitions: TransitionEdge[];
  transitionTable?: DFATransitionTable;
  startStateId: string;
  acceptStateIds: string[];
  regex?: string; // Source expression when derived from a regex NFA (subset construction, minimization)
}

export interface NFAConfig {
  id: string;
  name: string;
  type: 'NFA';
  states: StateNode[];
  alphabet: string[];
  transitions: TransitionEdge[];
  transitionTable?: NFATransitionTable;
  startStateId: string;
  acceptStateIds: string[];
  regex?: string; // Source expression when compiled by Thompson's construction
}

export interface TMConfig {
  id: string;
  name: string;
  type: 'TM';
  states: StateNode[];
  alphabet: string[];
  tapeAlphabet: string[];
  startStateId: string;
  acceptStateId: string;
  rejectStateId?: string;
  blankSymbol: string;
  transitions: TMTransitionRule[];
}

export type AutomatonDefinition = DFAConfig | NFAConfig | TMConfig;

export type StepStatus = 'PENDING' | 'STEPPING' | 'ACCEPTED' | 'REJECTED';

export interface ExecutionStep {
  stepIndex: number;
  currentStateId: string;           // Active state ID for DFA/TM
  currentNFAStateIds?: string[];     // Active state set for NFA (supports non-determinism)
  currentSymbol: string | null;      // Character being processed at this step
  consumedInput: string;            // Input before currentSymbol
  remainingInput: string;           // Input after currentSymbol
  status: StepStatus;               // Snapshot status
  description: string;              // Human-readable step explanation
  activeTransitionId?: string;       // ID of edge or rule highlighted on canvas/table
  activeTransitionIds?: string[];      // Multiple active edge IDs for non-deterministic branching
  tapeState?: string[];             // Tape contents (for Turing Machine)
  tapeHeadIndex?: number;           // Tape head index (for Turing Machine)
}
