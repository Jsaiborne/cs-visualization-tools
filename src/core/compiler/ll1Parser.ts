import { EPSILON, END_MARKER } from '../../types/cfg';
import type {
  Grammar,
  LL1Table,
  LL1Conflict,
  LL1ExecutionStep,
  ProductionRule,
} from '../../types/cfg';
import { calculateFirstOfSequence } from './cfgEngine';

/**
 * Generates 2D LL(1) Parsing Table grid and detects conflicts.
 */
export function generateLL1Table(
  grammar: Grammar,
  firstSets: Record<string, Set<string>>,
  followSets: Record<string, Set<string>>
): LL1Table {
  const grid: Record<string, Record<string, ProductionRule | null>> = {};
  const conflicts: LL1Conflict[] = [];

  // All terminal columns including END_MARKER '$'
  const columns = [...grammar.terminals, END_MARKER];

  // Initialize empty table grid
  for (const nt of grammar.nonTerminals) {
    grid[nt] = {};
    for (const term of columns) {
      grid[nt][term] = null;
    }
  }

  // Populate grid based on LL(1) rules
  for (const rule of grammar.productions) {
    const A = rule.lhs;
    const firstAlpha = calculateFirstOfSequence(rule.rhs, firstSets, grammar.terminals);

    // Rule 1: For each terminal a in FIRST(alpha), if a != ε, add A -> alpha to Table[A][a]
    for (const a of firstAlpha) {
      if (a !== EPSILON) {
        const existing = grid[A]?.[a];
        if (existing && existing.id !== rule.id) {
          conflicts.push({
            nonTerminal: A,
            terminal: a,
            existingRule: existing,
            newRule: rule,
          });
        } else if (grid[A]) {
          grid[A][a] = rule;
        }
      }
    }

    // Rule 2: If ε in FIRST(alpha), for each b in FOLLOW(A), add A -> alpha to Table[A][b]
    if (firstAlpha.has(EPSILON)) {
      const followA = followSets[A] || new Set<string>();
      for (const b of followA) {
        const existing = grid[A]?.[b];
        if (existing && existing.id !== rule.id) {
          conflicts.push({
            nonTerminal: A,
            terminal: b,
            existingRule: existing,
            newRule: rule,
          });
        } else if (grid[A]) {
          grid[A][b] = rule;
        }
      }
    }
  }

  return { grid, conflicts };
}

/**
 * Helper to tokenize an input test string against known terminals.
 */
export function tokenizeInput(input: string, terminals: string[]): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Sort terminals by length descending to match longest terminal first (e.g., "id" before "i")
  const sortedTerminals = [...terminals].sort((a, b) => b.length - a.length);

  const tokens: string[] = [];
  let index = 0;

  while (index < trimmed.length) {
    // Skip whitespace
    if (/\s/.test(trimmed[index])) {
      index++;
      continue;
    }

    let matched = false;
    for (const term of sortedTerminals) {
      if (trimmed.startsWith(term, index)) {
        tokens.push(term);
        index += term.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Single character token fallback
      tokens.push(trimmed[index]);
      index++;
    }
  }

  return tokens;
}

/**
 * Simulates a Pushdown Automaton (PDA) LL(1) stack-based parsing execution.
 */
export function simulateLL1(
  grammar: Grammar,
  table: LL1Table,
  input: string
): LL1ExecutionStep[] {
  if (!grammar.startSymbol || grammar.nonTerminals.length === 0) {
    return [
      {
        step: 0,
        stackState: [END_MARKER],
        remainingInput: [END_MARKER],
        inputIndex: 0,
        topOfStack: END_MARKER,
        currentLookahead: END_MARKER,
        actionTaken: 'Empty grammar provided.',
        status: 'ERROR',
      },
    ];
  }

  const rawTokens = tokenizeInput(input, grammar.terminals);
  const inputTokens = [...rawTokens, END_MARKER];

  const stack: string[] = [END_MARKER, grammar.startSymbol];
  const steps: LL1ExecutionStep[] = [];
  let inputIndex = 0;
  let stepCount = 0;
  const maxSteps = 300;

  while (stepCount < maxSteps) {
    stepCount++;
    const topOfStack = stack[stack.length - 1];
    const lookahead = inputTokens[inputIndex] || END_MARKER;
    const remainingInput = inputTokens.slice(inputIndex);

    // Case 1: Match end of input & stack -> ACCEPT
    if (topOfStack === END_MARKER && lookahead === END_MARKER) {
      steps.push({
        step: steps.length,
        stackState: [...stack],
        remainingInput: [...remainingInput],
        inputIndex,
        topOfStack,
        currentLookahead: lookahead,
        actionTaken: 'Accept! Input string successfully parsed.',
        status: 'ACCEPT',
      });
      break;
    }

    // Case 2: Terminal Match
    if (topOfStack === lookahead) {
      steps.push({
        step: steps.length,
        stackState: [...stack],
        remainingInput: [...remainingInput],
        inputIndex,
        topOfStack,
        currentLookahead: lookahead,
        actionTaken: `Match '${lookahead}'`,
        status: 'MATCH',
      });
      stack.pop();
      inputIndex++;
      continue;
    }

    // Case 3: Top of stack is terminal (or $) but does not match lookahead -> ERROR
    if (grammar.terminals.includes(topOfStack) || topOfStack === END_MARKER) {
      steps.push({
        step: steps.length,
        stackState: [...stack],
        remainingInput: [...remainingInput],
        inputIndex,
        topOfStack,
        currentLookahead: lookahead,
        actionTaken: `Mismatch error: Expected '${topOfStack}', got '${lookahead}'`,
        status: 'ERROR',
      });
      break;
    }

    // Case 4: Top of stack is Non-Terminal -> Lookup LL(1) Table
    if (grammar.nonTerminals.includes(topOfStack)) {
      const rule = table.grid[topOfStack]?.[lookahead];

      if (rule) {
        steps.push({
          step: steps.length,
          stackState: [...stack],
          remainingInput: [...remainingInput],
          inputIndex,
          topOfStack,
          currentLookahead: lookahead,
          actionTaken: `Predict ${rule.lhs} -> ${rule.rhs.join(' ')}`,
          status: 'PREDICT',
          appliedProduction: rule,
          highlightCell: { nonTerminal: topOfStack, terminal: lookahead },
        });

        // Pop Non-terminal
        stack.pop();

        // Push RHS symbols in REVERSE order onto stack (skipping ε)
        if (rule.rhs.length === 1 && rule.rhs[0] === EPSILON) {
          // ε derives empty string, do not push to stack
        } else {
          for (let j = rule.rhs.length - 1; j >= 0; j--) {
            stack.push(rule.rhs[j]);
          }
        }
      } else {
        // No production rule found -> Syntax Error
        steps.push({
          step: steps.length,
          stackState: [...stack],
          remainingInput: [...remainingInput],
          inputIndex,
          topOfStack,
          currentLookahead: lookahead,
          actionTaken: `Syntax Error: No production rule for (${topOfStack}, '${lookahead}')`,
          status: 'ERROR',
          highlightCell: { nonTerminal: topOfStack, terminal: lookahead },
        });
        break;
      }
    } else {
      // Fallback unknown symbol on stack
      steps.push({
        step: steps.length,
        stackState: [...stack],
        remainingInput: [...remainingInput],
        inputIndex,
        topOfStack,
        currentLookahead: lookahead,
        actionTaken: `Unexpected symbol '${topOfStack}' on stack`,
        status: 'ERROR',
      });
      break;
    }
  }

  return steps;
}
