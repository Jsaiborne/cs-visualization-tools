export type AutomatonType = 'DFA' | 'NFA' | 'PDA' | 'TM';

export interface StateNode {
  id: string;
  label: string;
  isStart: boolean;
  isAccept: boolean;
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
  direction?: 'L' | 'R' | 'S'; // For Turing Machine
}

export interface AutomatonDefinition {
  id: string;
  name: string;
  type: AutomatonType;
  states: StateNode[];
  alphabet: string[];
  transitions: TransitionEdge[];
  startStateId: string;
  acceptStateIds: string[];
}

export interface ExecutionStep {
  stepIndex: number;
  currentStateId: string;
  remainingInput: string;
  stackState?: string[]; // For PDA
  tapeState?: string[];  // For Turing Machine
  tapeHeadIndex?: number;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'STEPPING';
}
