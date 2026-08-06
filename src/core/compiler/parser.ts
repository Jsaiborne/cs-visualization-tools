import type { Token, ASTNode } from '../../types/compiler';

/**
 * Pure Recursive Descent Parser for a mathematical expression language.
 * Constructs a strongly-typed Abstract Syntax Tree (AST) with exact
 * character index offset ranges [start:end] for source code highlighting.
 *
 * Grammar Rules (Precedence: Primary > Multiplicative > Additive):
 *   Program                ::= Expression
 *   Expression             ::= AdditiveExpression
 *   AdditiveExpression     ::= MultiplicativeExpression ( ('+' | '-') MultiplicativeExpression )*
 *   MultiplicativeExpression ::= PrimaryExpression ( ('*' | '/' | '%' | '^') PrimaryExpression )*
 *   PrimaryExpression      ::= NUMBER | IDENTIFIER | KEYWORD | '(' Expression ')'
 */
export class Parser {
  private tokens: Token[];
  private cursor: number = 0;

  constructor(tokens: Token[]) {
    // Filter out unknown trailing whitespace tokens if any exist
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.cursor];
  }

  private consume(): Token {
    const token = this.tokens[this.cursor];
    this.cursor++;
    return token;
  }

  private expect(type: string, value?: string): Token {
    const token = this.peek();
    if (!token) {
      throw new Error(`Unexpected end of input. Expected ${value || type}.`);
    }
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(
        `Syntax Error at position ${token.start}: Expected '${value || type}' but found '${token.value}'.`
      );
    }
    return this.consume();
  }

  public parseProgram(): ASTNode | null {
    if (this.tokens.length === 0) {
      return null;
    }

    const body = this.parseExpression();

    if (this.cursor < this.tokens.length) {
      const extraToken = this.peek();
      throw new Error(
        `Syntax Error at position ${extraToken?.start}: Unexpected token '${extraToken?.value}'.`
      );
    }

    return {
      type: 'Program',
      start: body.start,
      end: body.end,
      body,
    };
  }

  private parseExpression(): ASTNode {
    return this.parseAdditive();
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (
      this.peek() &&
      this.peek()?.type === 'OPERATOR' &&
      ['+', '-'].includes(this.peek()!.value)
    ) {
      const opToken = this.consume();
      const right = this.parseMultiplicative();

      left = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left,
        right,
        start: left.start,
        end: right.end,
      };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parsePrimary();

    while (
      this.peek() &&
      this.peek()?.type === 'OPERATOR' &&
      ['*', '/', '%', '^'].includes(this.peek()!.value)
    ) {
      const opToken = this.consume();
      const right = this.parsePrimary();

      left = {
        type: 'BinaryExpression',
        operator: opToken.value,
        left,
        right,
        start: left.start,
        end: right.end,
      };
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (!token) {
      throw new Error('Unexpected end of input while parsing expression.');
    }

    // Number Literal
    if (token.type === 'NUMBER') {
      const numToken = this.consume();
      return {
        type: 'NumericLiteral',
        value: parseFloat(numToken.value),
        raw: numToken.value,
        start: numToken.start,
        end: numToken.end,
      };
    }

    // Identifier / Keyword
    if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
      const idToken = this.consume();
      return {
        type: 'Identifier',
        name: idToken.value,
        start: idToken.start,
        end: idToken.end,
      };
    }

    // Parenthesized Expression ( expr )
    if (token.type === 'PAREN_L') {
      const parenL = this.consume();
      const expr = this.parseExpression();
      const parenR = this.expect('PAREN_R', ')');

      // Preserve outer parenthesis range for accurate Monaco highlight
      return {
        ...expr,
        start: parenL.start,
        end: parenR.end,
      };
    }

    throw new Error(
      `Syntax Error at position ${token.start}: Unexpected token '${token.value}'.`
    );
  }
}

/**
 * Pure helper function to parse an array of tokens into an AST node graph.
 */
export function parse(tokens: Token[]): ASTNode | null {
  const parser = new Parser(tokens);
  return parser.parseProgram();
}
