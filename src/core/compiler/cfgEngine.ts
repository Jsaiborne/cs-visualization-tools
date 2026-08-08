import { EPSILON, END_MARKER } from '../../types/cfg';
import type { Grammar, ProductionRule } from '../../types/cfg';

/**
 * Parses raw text input into a structured Grammar object.
 * Format expected:
 * S -> A B | c
 * A -> a A | ε
 */
export function parseGrammarText(rawText: string): Grammar {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  if (lines.length === 0) {
    return {
      nonTerminals: [],
      terminals: [],
      startSymbol: '',
      productions: [],
    };
  }

  // Pass 1: Extract non-terminals from left-hand sides of rules
  const nonTerminalSet = new Set<string>();
  const rawRules: Array<{ lhs: string; rhsStrings: string[] }> = [];

  for (const line of lines) {
    const separator = line.includes('::=') ? '::=' : line.includes('->') ? '->' : null;
    if (!separator) continue;

    const [lhsRaw, rhsRaw] = line.split(separator).map((s) => s.trim());
    if (!lhsRaw) continue;

    const lhs = lhsRaw;
    nonTerminalSet.add(lhs);

    const rhsStrings = rhsRaw ? rhsRaw.split('|').map((s) => s.trim()) : [''];
    rawRules.push({ lhs, rhsStrings });
  }

  const nonTerminals = Array.from(nonTerminalSet);
  const startSymbol = nonTerminals.length > 0 ? nonTerminals[0] : '';

  // Helper to normalize individual RHS symbols
  const normalizeSymbol = (sym: string): string => {
    const lower = sym.toLowerCase();
    if (sym === '' || sym === 'ε' || lower === 'epsilon' || lower === 'eps' || lower === 'e') {
      return EPSILON;
    }
    return sym;
  };

  // Pass 2: Parse production rules and discover terminal symbols
  const productions: ProductionRule[] = [];
  const terminalSet = new Set<string>();
  let ruleCounter = 1;

  for (const { lhs, rhsStrings } of rawRules) {
    for (const rhsStr of rhsStrings) {
      let rhsSymbols: string[];

      // Tokenize RHS string
      const rawTokens = rhsStr.split(/\s+/).filter(Boolean);
      if (rawTokens.length === 0) {
        rhsSymbols = [EPSILON];
      } else {
        rhsSymbols = rawTokens.map(normalizeSymbol);
      }

      // Collect terminals
      for (const sym of rhsSymbols) {
        if (sym !== EPSILON && !nonTerminalSet.has(sym)) {
          terminalSet.add(sym);
        }
      }

      productions.push({
        id: `P${ruleCounter++}`,
        lhs,
        rhs: rhsSymbols,
      });
    }
  }

  const terminals = Array.from(terminalSet);

  return {
    nonTerminals,
    terminals,
    startSymbol,
    productions,
  };
}

/**
 * Calculates FIRST set for a sequence of symbols (α = Y1 Y2 ... Yk).
 */
export function calculateFirstOfSequence(
  sequence: string[],
  firstSets: Record<string, Set<string>>,
  terminals: string[]
): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }

  let allDeriveEpsilon = true;

  for (const symbol of sequence) {
    if (symbol === EPSILON) {
      continue;
    }

    if (terminals.includes(symbol)) {
      result.add(symbol);
      allDeriveEpsilon = false;
      break;
    }

    const symbolFirst = firstSets[symbol];
    if (symbolFirst) {
      for (const val of symbolFirst) {
        if (val !== EPSILON) {
          result.add(val);
        }
      }

      if (!symbolFirst.has(EPSILON)) {
        allDeriveEpsilon = false;
        break;
      }
    } else {
      // Treat as terminal if not found in firstSets
      result.add(symbol);
      allDeriveEpsilon = false;
      break;
    }
  }

  if (allDeriveEpsilon) {
    result.add(EPSILON);
  }

  return result;
}

/**
 * Computes the FIRST set for all non-terminals in the grammar using fixpoint iteration.
 */
export function calculateFirstSets(grammar: Grammar): Record<string, Set<string>> {
  const first: Record<string, Set<string>> = {};

  for (const nt of grammar.nonTerminals) {
    first[nt] = new Set<string>();
  }

  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Safeguard against infinite loops

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const rule of grammar.productions) {
      const A = rule.lhs;
      const currentSet = first[A];
      const initialSize = currentSet.size;

      if (rule.rhs.length === 1 && rule.rhs[0] === EPSILON) {
        currentSet.add(EPSILON);
      } else {
        const seqFirst = calculateFirstOfSequence(rule.rhs, first, grammar.terminals);
        for (const sym of seqFirst) {
          currentSet.add(sym);
        }
      }

      if (currentSet.size > initialSize) {
        changed = true;
      }
    }
  }

  return first;
}

/**
 * Computes the FOLLOW set for all non-terminals in the grammar using fixpoint iteration.
 */
export function calculateFollowSets(
  grammar: Grammar,
  firstSets: Record<string, Set<string>>
): Record<string, Set<string>> {
  const follow: Record<string, Set<string>> = {};

  for (const nt of grammar.nonTerminals) {
    follow[nt] = new Set<string>();
  }

  if (grammar.startSymbol && follow[grammar.startSymbol]) {
    follow[grammar.startSymbol].add(END_MARKER);
  }

  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const rule of grammar.productions) {
      const A = rule.lhs;
      const rhs = rule.rhs;

      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i];
        if (!grammar.nonTerminals.includes(B)) continue;

        const currentFollowB = follow[B];
        const initialSize = currentFollowB.size;

        const beta = rhs.slice(i + 1);
        const firstBeta = calculateFirstOfSequence(beta, firstSets, grammar.terminals);

        // Rule 2: Add FIRST(beta) \ {ε} to FOLLOW(B)
        for (const sym of firstBeta) {
          if (sym !== EPSILON) {
            currentFollowB.add(sym);
          }
        }

        // Rule 3: If beta is empty or ε ∈ FIRST(beta), add FOLLOW(A) to FOLLOW(B)
        if (beta.length === 0 || firstBeta.has(EPSILON)) {
          const followA = follow[A];
          if (followA) {
            for (const sym of followA) {
              currentFollowB.add(sym);
            }
          }
        }

        if (currentFollowB.size > initialSize) {
          changed = true;
        }
      }
    }
  }

  return follow;
}
