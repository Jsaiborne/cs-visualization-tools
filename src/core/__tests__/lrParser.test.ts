import { describe, it, expect } from 'vitest';
import { parseGrammarText } from '../compiler/cfgEngine';
import { tokenizeInput } from '../compiler/ll1Parser';
import { buildLRTable, simulateLR, itemText, type LRKind } from '../compiler/lrParser';
import { treeYield } from '../compiler/parseTree';

const ARITH = parseGrammarText(`E -> E + T | T
T -> T * F | F
F -> ( E ) | id`);
const LVALUE = parseGrammarText(`S -> L = R | R
L -> * R | id
R -> L`);
const LALR_RR = parseGrammarText(`S -> a A d | b B d | a B e | b A e
A -> c
B -> c`);
const TINY_LR0 = parseGrammarText('S -> ( S ) | x');

const conflicts = (grammar: typeof ARITH, kind: LRKind) => buildLRTable(grammar, kind).conflicts;

describe('buildLRTable', () => {
  it('arithmetic: LR(0) conflicts, SLR/LALR/CLR clean, with the textbook state counts', () => {
    expect(conflicts(ARITH, 'LR0').length).toBeGreaterThan(0);
    expect(conflicts(ARITH, 'LR0').every((c) => c.kind === 'shift/reduce')).toBe(true);
    for (const kind of ['SLR1', 'LALR1', 'CLR1'] as LRKind[]) expect(conflicts(ARITH, kind)).toEqual([]);
    expect(buildLRTable(ARITH, 'SLR1').states).toHaveLength(12);
    expect(buildLRTable(ARITH, 'LALR1').states).toHaveLength(12);
    expect(buildLRTable(ARITH, 'CLR1').states).toHaveLength(22);
  });

  it("L = R grammar: SLR shift/reduce conflict on '=', LALR clean", () => {
    const slr = conflicts(LVALUE, 'SLR1');
    expect(slr).toHaveLength(1);
    expect(slr[0]).toMatchObject({ symbol: '=', kind: 'shift/reduce' });
    expect(conflicts(LVALUE, 'LALR1')).toEqual([]);
    expect(conflicts(LVALUE, 'CLR1')).toEqual([]);
  });

  it('merging cores creates a reduce/reduce conflict that canonical LR(1) avoids', () => {
    const lalr = conflicts(LALR_RR, 'LALR1');
    expect(lalr.length).toBeGreaterThan(0);
    expect(lalr.every((c) => c.kind === 'reduce/reduce')).toBe(true);
    expect(conflicts(LALR_RR, 'CLR1')).toEqual([]);
    expect(buildLRTable(LALR_RR, 'LALR1').states.length).toBeLessThan(buildLRTable(LALR_RR, 'CLR1').states.length);
  });

  it('a small LR(0) grammar needs no lookahead', () => {
    expect(conflicts(TINY_LR0, 'LR0')).toEqual([]);
  });

  it('writes items in dot notation with lookaheads', () => {
    const lr0 = buildLRTable(ARITH, 'SLR1');
    expect(lr0.states[0].items.map((i) => itemText(i, lr0.productions))).toContain("E' → • E");
    const clr = buildLRTable(ARITH, 'CLR1');
    expect(itemText(clr.states[0].items[0], clr.productions)).toBe("E' → • E, $");
    expect(clr.states[0].items.map((i) => itemText(i, clr.productions))).toContain('E → • E + T, $/+');
  });
});

describe('simulateLR', () => {
  it.each(['SLR1', 'LALR1', 'CLR1'] as LRKind[])('%s accepts id + id * id and builds its parse tree', (kind) => {
    const table = buildLRTable(ARITH, kind);
    const { steps, roots, activeNodeByStep } = simulateLR(table, ARITH, 'id + id * id');
    expect(steps.at(-1)!.status).toBe('ACCEPT');
    expect(roots).toHaveLength(1);
    expect(roots[0].symbol).toBe('E');
    expect(treeYield(roots[0])).toEqual(tokenizeInput('id + id * id', ARITH.terminals));
    expect(activeNodeByStep).toHaveLength(steps.length);
    // * binds tighter: the top-level E is E + T
    expect(roots[0].children.map((c) => c.symbol)).toEqual(['E', '+', 'T']);
  });

  it('reports a syntax error with the failing state and lookahead', () => {
    const table = buildLRTable(ARITH, 'SLR1');
    const { steps, roots } = simulateLR(table, ARITH, 'id + * id');
    expect(steps.at(-1)).toMatchObject({ status: 'ERROR', lookahead: '*' });
    expect(roots.length).toBeGreaterThan(1); // partial forest
  });

  it('resolves conflicts like yacc and says so', () => {
    const table = buildLRTable(LVALUE, 'SLR1');
    const { steps } = simulateLR(table, LVALUE, 'id = id');
    expect(steps.some((s) => s.description.includes('conflict'))).toBe(true);
    expect(steps.at(-1)!.status).toBe('ACCEPT');
  });

  it('handles ε-productions', () => {
    const g = parseGrammarText('S -> a S b | ε');
    const table = buildLRTable(g, 'SLR1');
    expect(table.conflicts).toEqual([]);
    const { steps, roots } = simulateLR(table, g, 'a a b b');
    expect(steps.at(-1)!.status).toBe('ACCEPT');
    expect(treeYield(roots[0])).toEqual(['a', 'a', 'b', 'b']);
  });
});
