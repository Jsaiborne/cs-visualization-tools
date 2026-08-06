export type TokenType = 
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'OPERATOR'
  | 'PAREN_L'
  | 'PAREN_R'
  | 'DELIMITER'
  | 'STRING'
  | 'EOF'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface BaseASTNode {
  type: string;
  start: number;
  end: number;
  id?: string;
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  body: ASTNode;
}

export interface NumericLiteralNode extends BaseASTNode {
  type: 'NumericLiteral';
  value: number;
  raw: string;
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export type ASTNode = ProgramNode | NumericLiteralNode | IdentifierNode | BinaryExpressionNode;

export interface TACInstruction {
  op: string;
  arg1: string | null;
  arg2: string | null;
  result: string;
  originalRange?: {
    start: number;
    end: number;
  };
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
