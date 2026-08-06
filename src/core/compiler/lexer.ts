import type { Token } from '../../types/compiler';

/**
 * Pure lexer scanner function for a basic mathematical expression language.
 * Converts raw source code into an array of positional Token snapshots.
 *
 * Supported token types:
 * - NUMBER: Sequential digits (and optional decimal point e.g., 42, 3.14)
 * - OPERATOR: +, -, *, /, %, ^, =
 * - PAREN_L: (
 * - PAREN_R: )
 * - KEYWORD / IDENTIFIER: Named symbols or functions (sin, cos, pi, x)
 * - UNKNOWN: Unmatched characters
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  let currentLine = 1;
  let currentColumn = 1;

  while (i < n) {
    const char = input[i];

    // Handle whitespace: skip spaces, tabs, newlines, tracking line/column offsets
    if (/\s/.test(char)) {
      if (char === '\n') {
        currentLine++;
        currentColumn = 1;
      } else {
        currentColumn++;
      }
      i++;
      continue;
    }

    const start = i;
    const line = currentLine;
    const column = currentColumn;

    // Parentheses
    if (char === '(') {
      tokens.push({
        type: 'PAREN_L',
        value: '(',
        start,
        end: start + 1,
        line,
        column,
      });
      i++;
      currentColumn++;
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'PAREN_R',
        value: ')',
        start,
        end: start + 1,
        line,
        column,
      });
      i++;
      currentColumn++;
      continue;
    }

    // Mathematical Operators
    if (/[+\-*/%^=]/.test(char)) {
      tokens.push({
        type: 'OPERATOR',
        value: char,
        start,
        end: start + 1,
        line,
        column,
      });
      i++;
      currentColumn++;
      continue;
    }

    // Numbers (integer or floating point)
    if (/[0-9]/.test(char)) {
      let numStr = '';
      let hasDecimal = false;

      while (i < n) {
        const c = input[i];
        if (/[0-9]/.test(c)) {
          numStr += c;
          i++;
          currentColumn++;
        } else if (c === '.' && !hasDecimal && i + 1 < n && /[0-9]/.test(input[i + 1])) {
          hasDecimal = true;
          numStr += c;
          i++;
          currentColumn++;
        } else {
          break;
        }
      }

      tokens.push({
        type: 'NUMBER',
        value: numStr,
        start,
        end: i,
        line,
        column,
      });
      continue;
    }

    // Identifiers / Keywords (e.g. sin, cos, pi, x)
    if (/[a-zA-Z_]/.test(char)) {
      let identStr = '';
      while (i < n && /[a-zA-Z0-9_]/.test(input[i])) {
        identStr += input[i];
        i++;
        currentColumn++;
      }

      const isKeyword = ['sin', 'cos', 'tan', 'sqrt', 'log', 'abs', 'pi', 'e'].includes(identStr.toLowerCase());

      tokens.push({
        type: isKeyword ? 'KEYWORD' : 'IDENTIFIER',
        value: identStr,
        start,
        end: i,
        line,
        column,
      });
      continue;
    }

    // Unknown single character
    tokens.push({
      type: 'UNKNOWN',
      value: char,
      start,
      end: start + 1,
      line,
      column,
    });
    i++;
    currentColumn++;
  }

  return tokens;
}
