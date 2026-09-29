export type ScopeASTNodeType =
  | 'Program'
  | 'BlockStatement'
  | 'VariableDeclaration'
  | 'AssignmentExpression';

export interface BaseScopeASTNode {
  type: ScopeASTNodeType;
  line: number;
  start: number;
  end: number;
}

/** Whether a right-hand-side operand is a numeric literal or a reference to another variable. */
export type ScopeValueKind = 'number' | 'identifier';

export interface VariableDeclarationNode extends BaseScopeASTNode {
  type: 'VariableDeclaration';
  name: string;
  varType: string;
  initValue: string;
  initKind: ScopeValueKind;
}

export interface AssignmentExpressionNode extends BaseScopeASTNode {
  type: 'AssignmentExpression';
  name: string;
  value: string;
  valueKind: ScopeValueKind;
}

export interface BlockStatementNode extends BaseScopeASTNode {
  type: 'BlockStatement';
  body: ScopeASTNode[];
  endLine: number;
}

export interface ProgramScopeNode extends BaseScopeASTNode {
  type: 'Program';
  body: ScopeASTNode[];
}

export type ScopeASTNode =
  | ProgramScopeNode
  | BlockStatementNode
  | VariableDeclarationNode
  | AssignmentExpressionNode;

export interface ScopeToken {
  type: 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'ASSIGN' | 'SEMICOLON' | 'LBRACE' | 'RBRACE' | 'UNKNOWN';
  value: string;
  line: number;
  start: number;
  end: number;
}

/**
 * Tokenize source code for the scoped mini-language.
 */
export function tokenizeScopeLanguage(input: string): ScopeToken[] {
  const tokens: ScopeToken[] = [];
  let index = 0;
  let line = 1;

  while (index < input.length) {
    const char = input[index];

    // Track line numbers on newlines
    if (char === '\n') {
      line++;
      index++;
      continue;
    }

    // Skip whitespace (spaces, tabs, carriage returns)
    if (/\s/.test(char)) {
      index++;
      continue;
    }

    // Single-line comment check //
    if (char === '/' && input[index + 1] === '/') {
      while (index < input.length && input[index] !== '\n') {
        index++;
      }
      continue;
    }

    const start = index;

    // Braces & Semicolons & Equals
    if (char === '{') {
      tokens.push({ type: 'LBRACE', value: '{', line, start, end: index + 1 });
      index++;
      continue;
    }
    if (char === '}') {
      tokens.push({ type: 'RBRACE', value: '}', line, start, end: index + 1 });
      index++;
      continue;
    }
    if (char === ';') {
      tokens.push({ type: 'SEMICOLON', value: ';', line, start, end: index + 1 });
      index++;
      continue;
    }
    if (char === '=') {
      tokens.push({ type: 'ASSIGN', value: '=', line, start, end: index + 1 });
      index++;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let numStr = '';
      while (index < input.length && /[0-9]/.test(input[index])) {
        numStr += input[index];
        index++;
      }
      if (input[index] === '.' && /[0-9]/.test(input[index + 1] ?? '')) {
        numStr += input[index];
        index++;
        while (index < input.length && /[0-9]/.test(input[index])) {
          numStr += input[index];
          index++;
        }
      }
      tokens.push({ type: 'NUMBER', value: numStr, line, start, end: index });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (index < input.length && /[a-zA-Z0-9_]/.test(input[index])) {
        ident += input[index];
        index++;
      }

      if (ident === 'let') {
        tokens.push({ type: 'KEYWORD', value: ident, line, start, end: index });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, line, start, end: index });
      }
      continue;
    }

    // Unknown char
    tokens.push({ type: 'UNKNOWN', value: char, line, start, end: index + 1 });
    index++;
  }

  return tokens;
}

/**
 * Recursive descent parser for the scoped mini-language.
 */
export function parseScopeLanguage(input: string): ProgramScopeNode {
  const tokens = tokenizeScopeLanguage(input);
  let current = 0;

  function peek(): ScopeToken | undefined {
    return tokens[current];
  }

  function consume(expectedType?: string): ScopeToken {
    const token = tokens[current];
    if (!token) {
      throw new Error(`Unexpected end of input, expected ${expectedType || 'token'}`);
    }
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Line ${token.line}: Expected '${expectedType}' but found '${token.value}'`);
    }
    current++;
    return token;
  }

  function expectSemicolon(line: number): number {
    const token = peek();
    if (token?.type !== 'SEMICOLON') {
      throw new Error(`Line ${token?.line ?? line}: Expected ';' but found ${token ? `'${token.value}'` : 'end of input'}`);
    }
    return consume('SEMICOLON').end;
  }

  function parseStatement(): ScopeASTNode {
    const token = peek();
    if (!token) {
      throw new Error('Unexpected end of statements');
    }

    // Block Statement { ... }
    if (token.type === 'LBRACE') {
      const lbrace = consume('LBRACE');
      const body: ScopeASTNode[] = [];
      while (current < tokens.length && peek()?.type !== 'RBRACE') {
        body.push(parseStatement());
      }
      const rbrace = consume('RBRACE');
      return {
        type: 'BlockStatement',
        line: lbrace.line,
        endLine: rbrace.line,
        start: lbrace.start,
        end: rbrace.end,
        body,
      } as BlockStatementNode;
    }

    // Variable Declaration: let x = 1; or let x;
    if (token.type === 'KEYWORD' && token.value === 'let') {
      const letToken = consume('KEYWORD');
      const identToken = consume('IDENTIFIER');
      let initValue = '0';
      let initKind: ScopeValueKind = 'number';

      if (peek()?.type === 'ASSIGN') {
        consume('ASSIGN');
        const valToken = peek();
        if (valToken?.type === 'NUMBER' || valToken?.type === 'IDENTIFIER') {
          initValue = valToken.value;
          initKind = valToken.type === 'NUMBER' ? 'number' : 'identifier';
          current++;
        } else {
          throw new Error(`Line ${identToken.line}: Expected number or identifier after '='`);
        }
      }

      const endOffset = expectSemicolon(identToken.line);

      return {
        type: 'VariableDeclaration',
        name: identToken.value,
        varType: 'number',
        initValue,
        initKind,
        line: letToken.line,
        start: letToken.start,
        end: endOffset,
      } as VariableDeclarationNode;
    }

    // Assignment Expression: x = 4;
    if (token.type === 'IDENTIFIER') {
      const identToken = consume('IDENTIFIER');
      if (peek()?.type === 'ASSIGN') {
        consume('ASSIGN');
        const valToken = peek();
        let value = '0';
        let valueKind: ScopeValueKind = 'number';
        if (valToken?.type === 'NUMBER' || valToken?.type === 'IDENTIFIER') {
          value = valToken.value;
          valueKind = valToken.type === 'NUMBER' ? 'number' : 'identifier';
          current++;
        } else {
          throw new Error(`Line ${identToken.line}: Expected expression after '='`);
        }

        const endOffset = expectSemicolon(identToken.line);

        return {
          type: 'AssignmentExpression',
          name: identToken.value,
          value,
          valueKind,
          line: identToken.line,
          start: identToken.start,
          end: endOffset,
        } as AssignmentExpressionNode;
      } else {
        throw new Error(`Line ${identToken.line}: Unexpected identifier '${identToken.value}'`);
      }
    }

    throw new Error(`Line ${token.line}: Unexpected token '${token.value}'`);
  }

  const statements: ScopeASTNode[] = [];
  while (current < tokens.length) {
    statements.push(parseStatement());
  }

  return {
    type: 'Program',
    line: 1,
    start: 0,
    end: input.length,
    body: statements,
  };
}
