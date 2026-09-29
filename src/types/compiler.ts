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

export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: ASTNode;
}

export type ASTNode =
  | ProgramNode
  | NumericLiteralNode
  | IdentifierNode
  | BinaryExpressionNode
  | UnaryExpressionNode;

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
