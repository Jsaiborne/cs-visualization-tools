import { EPSILON } from '../../types/cfg';
import type { Grammar, ProductionRule } from '../../types/cfg';

export interface TransformStep {
  description: string;
  grammarText: string;
}

export interface TransformResult {
  grammar: Grammar;
  steps: TransformStep[];
  /** Problems the transformation could not fix (e.g. a nonterminal with only left-recursive rules) */
  warnings: string[];
}

const isEpsilonRule = (rhs: string[]) => rhs.length === 0 || (rhs.length === 1 && rhs[0] === EPSILON);

/** Serializes a grammar in the editor's format, one line per nonterminal: `A -> α | β`. */
export function grammarToText(grammar: Grammar): string {
  return grammar.nonTerminals
    .map((nt) => {
      const alternatives = grammar.productions
        .filter((p) => p.lhs === nt)
        .map((p) => (isEpsilonRule(p.rhs) ? EPSILON : p.rhs.join(' ')));
      return alternatives.length > 0 ? `${nt} -> ${alternatives.join(' | ')}` : null;
    })
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** Rebuilds terminals and production ids after a transformation. */
function normalize(nonTerminals: string[], rules: Map<string, string[][]>, startSymbol: string): Grammar {
  const productions: ProductionRule[] = [];
  const ntSet = new Set(nonTerminals);
  const terminals = new Set<string>();
  let counter = 1;
  for (const nt of nonTerminals) {
    const seen = new Set<string>();
    for (const rhs of rules.get(nt) ?? []) {
      const normalized = rhs.length === 0 ? [EPSILON] : rhs;
      const key = normalized.join(' ');
      if (seen.has(key)) continue; // drop duplicate alternatives
      seen.add(key);
      productions.push({ id: `P${counter++}`, lhs: nt, rhs: normalized });
      for (const sym of normalized) if (sym !== EPSILON && !ntSet.has(sym)) terminals.add(sym);
    }
  }
  return { nonTerminals, terminals: [...terminals], startSymbol, productions };
}

function rulesOf(grammar: Grammar): Map<string, string[][]> {
  const rules = new Map<string, string[][]>(grammar.nonTerminals.map((nt) => [nt, []]));
  for (const p of grammar.productions) {
    rules.get(p.lhs)!.push(isEpsilonRule(p.rhs) ? [] : [...p.rhs]);
  }
  return rules;
}

/** A' , A'' , … : the first primed name not already used. */
function freshName(base: string, taken: Set<string>): string {
  let name = `${base}'`;
  while (taken.has(name)) name += "'";
  taken.add(name);
  return name;
}

export function nullableSet(grammar: Grammar): Set<string> {
  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of grammar.productions) {
      if (nullable.has(p.lhs)) continue;
      if (isEpsilonRule(p.rhs) || p.rhs.every((s) => nullable.has(s))) {
        nullable.add(p.lhs);
        changed = true;
      }
    }
  }
  return nullable;
}

/**
 * Nonterminals that are left-recursive, directly (A → A α) or indirectly (A → B α, B → A β),
 * including recursion hidden behind nullable prefixes (A → B A α with B ⇒ ε).
 */
export function findLeftRecursion(grammar: Grammar): string[] {
  const nts = new Set(grammar.nonTerminals);
  const nullable = nullableSet(grammar);
  // leftEdges[A] = nonterminals that can appear leftmost in a one-step derivation from A
  const leftEdges = new Map<string, Set<string>>(grammar.nonTerminals.map((nt) => [nt, new Set()]));
  for (const p of grammar.productions) {
    for (const sym of p.rhs) {
      if (sym === EPSILON) break;
      if (nts.has(sym)) leftEdges.get(p.lhs)!.add(sym);
      if (!nullable.has(sym)) break;
    }
  }
  const reaches = (from: string, target: string) => {
    const seen = new Set<string>();
    const stack = [...(leftEdges.get(from) ?? [])];
    while (stack.length > 0) {
      const x = stack.pop()!;
      if (x === target) return true;
      if (seen.has(x)) continue;
      seen.add(x);
      stack.push(...(leftEdges.get(x) ?? []));
    }
    return false;
  };
  return grammar.nonTerminals.filter((nt) => reaches(nt, nt));
}

/** Nonterminals with two alternatives that start with the same symbol (need left factoring). */
export function findCommonPrefixes(grammar: Grammar): string[] {
  return grammar.nonTerminals.filter((nt) => {
    const firsts = grammar.productions.filter((p) => p.lhs === nt && !isEpsilonRule(p.rhs)).map((p) => p.rhs[0]);
    return new Set(firsts).size < firsts.length;
  });
}

/**
 * Removes left recursion (Aho et al., Algorithm 4.19). With nonterminals ordered A1..An, for each
 * Ai: substitute Aj's alternatives into rules Ai → Aj γ (j < i) where Aj can derive Ai leftmost,
 * exposing indirect recursion, then replace direct recursion
 *   A → A α1 | … | β1 | …   with   A → β1 A' | …,   A' → α1 A' | … | ε.
 * Substitution is skipped when Aj can't lead back to Ai, which keeps unrelated rules untouched.
 */
export function eliminateLeftRecursion(grammar: Grammar): TransformResult {
  const steps: TransformStep[] = [];
  const warnings: string[] = [];
  const order = [...grammar.nonTerminals];
  const nonTerminals = [...grammar.nonTerminals];
  const taken = new Set(nonTerminals);
  const rules = rulesOf(grammar);
  const snapshot = () => grammarToText(normalize(nonTerminals, rules, grammar.startSymbol));

  if (nullableSet(grammar).size > 0 && findLeftRecursion(grammar).length > 0) {
    warnings.push('The grammar has ε-productions, so some left recursion may stay hidden behind nullable symbols.');
  }

  const leftReaches = (from: string, target: string) => {
    const seen = new Set<string>();
    const stack = [from];
    while (stack.length > 0) {
      const x = stack.pop()!;
      if (x === target) return true;
      if (seen.has(x)) continue;
      seen.add(x);
      for (const rhs of rules.get(x) ?? []) if (rhs.length > 0 && rules.has(rhs[0])) stack.push(rhs[0]);
    }
    return false;
  };

  for (let i = 0; i < order.length; i++) {
    const ai = order[i];

    for (let j = 0; j < i; j++) {
      const aj = order[j];
      const current = rules.get(ai)!;
      if (!current.some((rhs) => rhs[0] === aj) || !leftReaches(aj, ai)) continue;
      const replaced: string[][] = [];
      for (const rhs of current) {
        if (rhs[0] === aj) {
          for (const delta of rules.get(aj)!) replaced.push([...delta, ...rhs.slice(1)]);
        } else {
          replaced.push(rhs);
        }
      }
      rules.set(ai, replaced);
      steps.push({
        description: `Substitute ${aj}'s alternatives into ${ai} → ${aj} … to expose indirect left recursion.`,
        grammarText: snapshot(),
      });
    }

    const alternatives = rules.get(ai)!;
    const recursive = alternatives.filter((rhs) => rhs[0] === ai).map((rhs) => rhs.slice(1));
    if (recursive.length === 0) continue;
    const others = alternatives.filter((rhs) => rhs[0] !== ai);
    if (others.length === 0) {
      warnings.push(`${ai} has only left-recursive alternatives, so it derives no finite string.`);
    }
    const prime = freshName(ai, taken);
    nonTerminals.splice(nonTerminals.indexOf(ai) + 1, 0, prime);
    rules.set(ai, others.map((beta) => [...beta, prime]));
    rules.set(prime, [...recursive.filter((alpha) => alpha.length > 0).map((alpha) => [...alpha, prime]), []]);
    steps.push({
      description: `Remove direct left recursion from ${ai}: ${ai} → β ${prime} and ${prime} → α ${prime} | ε.`,
      grammarText: snapshot(),
    });
  }

  if (steps.length === 0) {
    steps.push({ description: 'No left recursion found; the grammar is unchanged.', grammarText: snapshot() });
  }
  return { grammar: normalize(nonTerminals, rules, grammar.startSymbol), steps, warnings };
}

/**
 * Left factoring: while some nonterminal has two or more alternatives sharing a first symbol,
 * pull out their longest common prefix α:  A → α β1 | α β2 | γ   becomes   A → α A' | γ,  A' → β1 | β2.
 */
export function leftFactor(grammar: Grammar): TransformResult {
  const steps: TransformStep[] = [];
  const nonTerminals = [...grammar.nonTerminals];
  const taken = new Set(nonTerminals);
  const rules = rulesOf(grammar);
  const snapshot = () => grammarToText(normalize(nonTerminals, rules, grammar.startSymbol));

  let changed = true;
  while (changed) {
    changed = false;
    for (const nt of [...nonTerminals]) {
      const alternatives = rules.get(nt)!;
      const byFirst = new Map<string, string[][]>();
      for (const rhs of alternatives) {
        if (rhs.length === 0) continue;
        byFirst.set(rhs[0], [...(byFirst.get(rhs[0]) ?? []), rhs]);
      }
      const group = [...byFirst.values()].find((g) => g.length > 1);
      if (!group) continue;

      let prefixLength = 1;
      while (group.every((rhs) => rhs.length > prefixLength && rhs[prefixLength] === group[0][prefixLength])) {
        prefixLength++;
      }
      const prefix = group[0].slice(0, prefixLength);
      const prime = freshName(nt, taken);
      nonTerminals.splice(nonTerminals.indexOf(nt) + 1, 0, prime);
      rules.set(nt, [...alternatives.filter((rhs) => !group.includes(rhs)), [...prefix, prime]]);
      rules.set(prime, group.map((rhs) => rhs.slice(prefixLength)));
      steps.push({
        description: `Factor the common prefix "${prefix.join(' ')}" out of ${nt} into ${prime}.`,
        grammarText: snapshot(),
      });
      changed = true;
      break;
    }
  }

  if (steps.length === 0) {
    steps.push({ description: 'No common prefixes found; the grammar is unchanged.', grammarText: snapshot() });
  }
  return { grammar: normalize(nonTerminals, rules, grammar.startSymbol), steps, warnings: [] };
}
