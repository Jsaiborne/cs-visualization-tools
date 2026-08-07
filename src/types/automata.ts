export type AutomatonType = 'DFA' | 'NFA' | 'PDA' | 'TM';

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
  pushSymbol?: string; // For PDA
  popSymbol?: string;  // For PDA
  writeSymbol?: string; // For Turing Machine
  direction?: TMDirection; // For Turing Machine
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
  consumedInput: string;            // Substring processed so far
  remainingInput: string;           // Substring left to process
  status: StepStatus;               // Snapshot status
  description: string;              // Human-readable step explanation
  activeTransitionId?: string;       // ID of edge or rule highlighted on canvas/table
  activeTransitionIds?: string[];      // Multiple active edge IDs for non-deterministic branching
  stackState?: string[];            // Stack contents (for PDA)
  tapeState?: string[];             // Tape contents (for Turing Machine)
  tapeHeadIndex?: number;           // Tape head index (for Turing Machine)
}
