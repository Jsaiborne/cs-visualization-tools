import { describe, it, expect } from 'vitest';
import { tokenize } from '../compiler/lexer';
import { parse } from '../compiler/parser';
import { generateTAC } from '../compiler/tacGenerator';
import { parseGrammarText, calculateFirstSets, calculateFollowSets } from '../compiler/cfgEngine';
import { generateLL1Table, simulateLL1 } from '../compiler/ll1Parser';
import { parseScopeLanguage } from '../compiler/scopeParser';
import { analyzeScopes } from '../compiler/semanticAnalyzer';
import { PRESET_GRAMMARS } from '../../store/useGrammarStore';
import { SCOPE_PRESETS } from '../../store/useScopeStore';
import type { ASTNode } from '../../types/compiler';

/** Renders an AST as a fully parenthesized string, e.g. "(2 * (3 ^ 2))". */
function show(node: ASTNode | null): string {
  if (!node) return '';
  switch (node.type) {
    case 'Program':
      return show(node.body);
    case 'NumericLiteral':
      return node.raw;
    case 'Identifier':
      return node.name;
    case 'UnaryExpression':
      return `(${node.operator}${show(node.argument)})`;
    case 'BinaryExpression':
      return `(${show(node.left)} ${node.operator} ${show(node.right)})`;
  }
}

const parseExpr = (src: string) => show(parse(tokenize(src)));

describe('expression parser', () => {
  it('respects standard precedence', () => {
    expect(parseExpr('1 + 2 * 3')).toBe('(1 + (2 * 3))');
    expect(parseExpr('(5 + 32) * 4')).toBe('((5 + 32) * 4)');
  });

  it('binds ^ tighter than * and groups it right-to-left', () => {
    expect(parseExpr('2 * 3 ^ 2')).toBe('(2 * (3 ^ 2))');
    expect(parseExpr('2 ^ 3 ^ 2')).toBe('(2 ^ (3 ^ 2))');
  });

  it('parses unary minus', () => {
    expect(parseExpr('-5 + 2')).toBe('((-5) + 2)');
    expect(parseExpr('-2 ^ 2')).toBe('(-(2 ^ 2))');
    expect(parseExpr('2 ^ -1')).toBe('(2 ^ (-1))');
  });

  it('reports syntax errors', () => {
    expect(() => parse(tokenize('1 +'))).toThrow();
    expect(() => parse(tokenize('(1 + 2'))).toThrow();
  });
});

describe('generateTAC', () => {
  it('emits one instruction per operator in post-order', () => {
    const tac = generateTAC(parse(tokenize('a + b * c')));
    expect(tac.map((i) => `${i.result} = ${i.arg1} ${i.op} ${i.arg2}`)).toEqual([
      't1 = b * c',
      't2 = a + t1',
    ]);
  });

  it('emits unary instructions with a null second operand', () => {
    const [instr] = generateTAC(parse(tokenize('-x')));
    expect(instr).toMatchObject({ op: '-', arg1: 'x', arg2: null, result: 't1' });
  });
});

function runLL1(grammarText: string, input: string) {
  const grammar = parseGrammarText(grammarText);
  const first = calculateFirstSets(grammar);
  const follow = calculateFollowSets(grammar, first);
  const table = generateLL1Table(grammar, first, follow);
  return { grammar, first, follow, table, steps: simulateLL1(grammar, table, input) };
}

describe('LL(1) parsing', () => {
  it.each(PRESET_GRAMMARS)('accepts the $name preset input', ({ grammarText, testInput }) => {
    const { table, steps } = runLL1(grammarText, testInput);
    expect(table.conflicts).toHaveLength(0);
    expect(steps.at(-1)!.status).toBe('ACCEPT');
  });

  it('computes FIRST and FOLLOW for the arithmetic grammar', () => {
    const { first, follow } = runLL1(PRESET_GRAMMARS[0].grammarText, '');
    expect([...first['E']].sort()).toEqual(['(', 'id']);
    expect([...follow["E'"]].sort()).toEqual(['$', ')']);
    expect([...follow['F']].sort()).toEqual(['$', ')', '*', '+']);
  });

  it("keeps 'e' as a terminal instead of epsilon", () => {
    const { grammar } = runLL1('S -> e S | x', 'e x');
    expect(grammar.terminals).toContain('e');
  });

  it('ends with an ERROR step when a left-recursive grammar exceeds the step limit', () => {
    const { table, steps } = runLL1('E -> E + T | T\nT -> id', 'id + id');
    expect(table.conflicts.length).toBeGreaterThan(0);
    expect(steps.at(-1)!.status).toBe('ERROR');
  });
});

describe('semantic analyzer', () => {
  const analyze = (code: string) => analyzeScopes(parseScopeLanguage(code));
  const errors = (code: string) => analyze(code).filter((s) => s.isError);

  it.each(SCOPE_PRESETS)('runs the $name preset without errors', ({ code }) => {
    expect(errors(code)).toHaveLength(0);
  });

  it('resolves identifier values through the scope chain', () => {
    const steps = analyze('let a = 7;\n{\n  let b = a;\n}');
    const declB = steps.find((s) => s.targetVariable === 'b')!;
    const inner = declB.activeScopeStack[declB.activeScopeStack.length - 1];
    expect(inner.variables['b'].value).toBe('7');
  });

  it('flags assignment to an undeclared variable', () => {
    expect(errors('x = 1;')).toHaveLength(1);
  });

  it('flags use of an undeclared identifier', () => {
    expect(errors('let x = y;')).toHaveLength(1);
  });

  it('flags redeclaration in the same scope but allows shadowing', () => {
    expect(errors('let x = 1;\nlet x = 2;')).toHaveLength(1);
    expect(errors('let x = 1;\n{\n  let x = 2;\n}')).toHaveLength(0);
  });

  it('rejects variables used after their block ends', () => {
    expect(errors('{\n  let t = 1;\n}\nlet u = t;')).toHaveLength(1);
  });

  it('requires semicolons and well-formed numbers', () => {
    expect(() => parseScopeLanguage('let x = 1')).toThrow(/Expected ';'/);
    expect(() => parseScopeLanguage('let x = 1.2.3;')).toThrow();
  });
});
