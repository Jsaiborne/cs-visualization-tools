export type TokenType = 
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'OPERATOR'
  | 'DELIMITER'
  | 'STRING'
  | 'EOF'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface ASTNode {
  id: string;
  type: string;
  value?: string;
  children: ASTNode[];
  meta?: Record<string, unknown>;
}

export interface GrammarProduction {
  id: string;
  lhs: string; // Left-hand non-terminal e.g. 'E'
  rhs: string[]; // Right-hand symbols e.g. ['E', '+', 'T']
}

export interface ParsingTableEntry {
  state: number;
  symbol: string;
  action: 'SHIFT' | 'REDUCE' | 'ACCEPT' | 'ERROR';
  targetState?: number;
  productionId?: string;
}
