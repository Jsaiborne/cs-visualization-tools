export interface ProductionRule {
  id: string;
  lhs: string; // Left-hand non-terminal e.g. "E"
  rhs: string[]; // Right-hand symbols e.g. ["T", "E'"] or ["ε"]
}

export interface Grammar {
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  productions: ProductionRule[];
}

export interface LL1Conflict {
  nonTerminal: string;
  terminal: string;
  existingRule: ProductionRule;
  newRule: ProductionRule;
}

export interface LL1Table {
  grid: Record<string, Record<string, ProductionRule | null>>;
  conflicts: LL1Conflict[];
}

export interface LL1ExecutionStep {
  step: number;
  stackState: string[];
  remainingInput: string[];
  inputIndex: number;
  topOfStack: string;
  currentLookahead: string;
  actionTaken: string;
  status: 'PREDICT' | 'MATCH' | 'ACCEPT' | 'ERROR';
  appliedProduction?: ProductionRule;
  highlightCell?: {
    nonTerminal: string;
    terminal: string;
  };
}

export const EPSILON = 'ε';
export const END_MARKER = '$';
