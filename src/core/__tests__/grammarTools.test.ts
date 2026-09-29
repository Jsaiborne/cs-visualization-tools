import { describe, it, expect } from 'vitest';
import { parseGrammarText, calculateFirstSets, calculateFollowSets } from '../compiler/cfgEngine';
import { generateLL1Table, simulateLL1, tokenizeInput } from '../compiler/ll1Parser';
import {
  grammarToText,
  eliminateLeftRecursion,
  leftFactor,
  findLeftRecursion,
  findCommonPrefixes,
} from '../compiler/grammarTransforms';
import { buildLL1ParseTree, treeYield } from '../compiler/parseTree';
import { PRESET_GRAMMARS } from '../../store/useGrammarStore';
import type { Grammar } from '../../types/cfg';

const LEFT_RECURSIVE_ARITH = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`;

function ll1(grammar: Grammar, input: string) {
  const first = calculateFirstSets(grammar);
  const table = generateLL1Table(grammar, first, calculateFollowSets(grammar, first));
  const steps = simulateLL1(grammar, table, input);
  return { table, steps };
}

describe('grammarToText', () => {
  it.each(PRESET_GRAMMARS)('round-trips the $name preset', ({ grammarText }) => {
    const grammar = parseGrammarText(grammarText);
    expect(parseGrammarText(grammarToText(grammar))).toEqual(grammar);
  });
});

describe('findLeftRecursion / findCommonPrefixes', () => {
  it('detects direct, indirect and nullable-hidden left recursion', () => {
    expect(findLeftRecursion(parseGrammarText(LEFT_RECURSIVE_ARITH))).toEqual(['E', 'T']);
    expect(findLeftRecursion(parseGrammarText('S -> A a | b\nA -> S c | d')).sort()).toEqual(['A', 'S']);
    expect(findLeftRecursion(parseGrammarText('S -> B S a | x\nB -> ε'))).toEqual(['S']);
    expect(findLeftRecursion(parseGrammarText(PRESET_GRAMMARS[0].grammarText))).toEqual([]);
  });

  it('detects alternatives sharing a first symbol', () => {
    expect(findCommonPrefixes(parseGrammarText('S -> i E t S | i E t S e S | a\nE -> b'))).toEqual(['S']);
    expect(findCommonPrefixes(parseGrammarText(PRESET_GRAMMARS[0].grammarText))).toEqual([]);
  });
});

describe('eliminateLeftRecursion', () => {
  it('turns the left-recursive expression grammar into a conflict-free LL(1) grammar', () => {
    const { grammar, steps, warnings } = eliminateLeftRecursion(parseGrammarText(LEFT_RECURSIVE_ARITH));
    expect(findLeftRecursion(grammar)).toEqual([]);
    expect(warnings).toEqual([]);
    expect(grammarToText(grammar)).toBe(
      ["E -> T E'", "E' -> + T E' | ε", "T -> F T'", "T' -> * F T' | ε", 'F -> ( E ) | id'].join('\n')
    );
    expect(steps).toHaveLength(2);

    const { table, steps: parse } = ll1(grammar, 'id + id * id');
    expect(table.conflicts).toEqual([]);
    expect(parse.at(-1)!.status).toBe('ACCEPT');
  });

  it('removes indirect left recursion by substitution (Aho et al., Example 4.20)', () => {
    const { grammar, steps, warnings } = eliminateLeftRecursion(parseGrammarText('S -> A a | b\nA -> A c | S d | ε'));
    expect(findLeftRecursion(grammar)).toEqual([]);
    expect(steps.map((s) => s.description.split(' ')[0])).toEqual(['Substitute', 'Remove']);
    expect(grammarToText(grammar)).toBe(["S -> A a | b", "A -> b d A' | A'", "A' -> c A' | a d A' | ε"].join('\n'));
    expect(warnings[0]).toMatch(/ε-productions/);
  });

  it('leaves grammars without left recursion unchanged', () => {
    const grammar = parseGrammarText(PRESET_GRAMMARS[1].grammarText);
    const result = eliminateLeftRecursion(grammar);
    expect(grammarToText(result.grammar)).toBe(grammarToText(grammar));
    expect(result.steps[0].description).toMatch(/unchanged/);
  });

  it('warns about a nonterminal with only left-recursive rules', () => {
    expect(eliminateLeftRecursion(parseGrammarText('S -> S a')).warnings[0]).toMatch(/only left-recursive/);
  });
});

describe('leftFactor', () => {
  it('factors the dangling-else prefix', () => {
    const { grammar, steps } = leftFactor(parseGrammarText('S -> i E t S | i E t S e S | a\nE -> b'));
    expect(findCommonPrefixes(grammar)).toEqual([]);
    expect(grammarToText(grammar)).toBe(["S -> a | i E t S S'", "S' -> ε | e S", 'E -> b'].join('\n'));
    expect(steps[0].description).toContain('"i E t S"');
  });

  it('factors repeatedly until no prefixes remain', () => {
    const { grammar, steps } = leftFactor(parseGrammarText('A -> a b c | a b d | a e'));
    expect(findCommonPrefixes(grammar)).toEqual([]);
    expect(steps.length).toBe(2);
    const { steps: parse } = ll1(grammar, 'a b d');
    expect(parse.at(-1)!.status).toBe('ACCEPT');
  });
});

describe('buildLL1ParseTree', () => {
  it.each(PRESET_GRAMMARS)('yields the input for the $name preset', ({ grammarText, testInput }) => {
    const grammar = parseGrammarText(grammarText);
    const { steps } = ll1(grammar, testInput);
    const { root, activeNodeByStep } = buildLL1ParseTree(steps, grammar);
    expect(root?.symbol).toBe(grammar.startSymbol);
    expect(treeYield(root)).toEqual(tokenizeInput(testInput, grammar.terminals));
    expect(activeNodeByStep).toHaveLength(steps.length);
  });

  it('reveals nodes step by step and uses ε leaves', () => {
    const grammar = parseGrammarText(PRESET_GRAMMARS[0].grammarText);
    const { steps } = ll1(grammar, 'id');
    const { root } = buildLL1ParseTree(steps, grammar);
    expect(root!.createdAtStep).toBe(0);
    expect(root!.children.map((c) => c.symbol)).toEqual(['T', "E'"]);
    expect(root!.children[0].createdAtStep).toBe(1);
    const ePrime = root!.children[1];
    expect(ePrime.children.map((c) => c.kind)).toEqual(['epsilon']);
  });

  it('keeps unexpanded nonterminals as nonterminals after a syntax error', () => {
    const grammar = parseGrammarText(PRESET_GRAMMARS[0].grammarText);
    const { steps } = ll1(grammar, 'id +');
    expect(steps.at(-1)!.status).toBe('ERROR');
    const { root } = buildLL1ParseTree(steps, grammar);
    const kinds = new Map<string, string>();
    const walk = (n: typeof root) => {
      if (!n) return;
      kinds.set(n.symbol, n.kind);
      n.children.forEach(walk);
    };
    walk(root);
    expect(kinds.get('T')).toBe('nonterminal');
    expect(kinds.get('+')).toBe('terminal');
  });
});
