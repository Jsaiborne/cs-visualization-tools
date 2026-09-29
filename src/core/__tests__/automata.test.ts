import { describe, it, expect } from 'vitest';
import { simulateDFA, simulateNFA } from '../automata';
import { compileRegexToNFA } from '../automata/regexCompiler';
import { simulateTM } from '../automata/turingMachine';
import { defaultDFA, binaryIncrementerTM } from '../../store/useAutomataStore';
import type { NFAConfig } from '../../types/automata';

const finalStatus = (steps: { status: string }[]) => steps[steps.length - 1].status;
const regexAccepts = (regex: string, input: string) =>
  finalStatus(simulateNFA(compileRegexToNFA(regex), input)) === 'ACCEPTED';

describe('simulateDFA', () => {
  it('accepts binary strings with an even number of zeros', () => {
    expect(finalStatus(simulateDFA(defaultDFA, '1001'))).toBe('ACCEPTED');
    expect(finalStatus(simulateDFA(defaultDFA, '10010'))).toBe('REJECTED');
    expect(finalStatus(simulateDFA(defaultDFA, ''))).toBe('ACCEPTED');
  });

  it('splits input into text before / at / after the current symbol', () => {
    const step = simulateDFA(defaultDFA, '10010')[2];
    expect(step.consumedInput).toBe('1');
    expect(step.currentSymbol).toBe('0');
    expect(step.remainingInput).toBe('010');
  });

  it('rejects symbols outside the alphabet', () => {
    const steps = simulateDFA(defaultDFA, '10x');
    expect(finalStatus(steps)).toBe('REJECTED');
    expect(steps[steps.length - 1].currentSymbol).toBe('x');
  });
});

describe('simulateNFA', () => {
  it("treats the letter 'e' as an ordinary symbol, not epsilon", () => {
    const nfa: NFAConfig = {
      id: 'n',
      name: 'n',
      type: 'NFA',
      alphabet: ['e'],
      startStateId: 'q0',
      acceptStateIds: ['q1'],
      states: [
        { id: 'q0', label: 'q0', isStart: true, isAccept: false },
        { id: 'q1', label: 'q1', isStart: false, isAccept: true },
      ],
      transitions: [{ id: 't0', from: 'q0', to: 'q1', symbol: 'e' }],
    };
    expect(finalStatus(simulateNFA(nfa, ''))).toBe('REJECTED');
    expect(finalStatus(simulateNFA(nfa, 'e'))).toBe('ACCEPTED');
  });

  it('follows every epsilon alias out of a state', () => {
    const nfa: NFAConfig = {
      id: 'n',
      name: 'n',
      type: 'NFA',
      alphabet: [],
      startStateId: 'q0',
      acceptStateIds: ['q2'],
      states: ['q0', 'q1', 'q2'].map((id) => ({ id, label: id, isStart: id === 'q0', isAccept: id === 'q2' })),
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'ε' },
        { id: 't1', from: 'q0', to: 'q2', symbol: 'eps' },
      ],
    };
    expect(simulateNFA(nfa, '')[0].currentNFAStateIds?.sort()).toEqual(['q0', 'q1', 'q2']);
  });
});

describe('compileRegexToNFA', () => {
  it('handles words containing the letter e', () => {
    expect(regexAccepts('hello', 'hello')).toBe(true);
    expect(regexAccepts('hello', 'hllo')).toBe(false);
  });

  it('matches the classic (a|b)*abb language', () => {
    expect(regexAccepts('(a|b)*abb', 'aabb')).toBe(true);
    expect(regexAccepts('(a|b)*abb', 'babb')).toBe(true);
    expect(regexAccepts('(a|b)*abb', 'ab')).toBe(false);
  });

  it('supports + and ?', () => {
    expect(regexAccepts('a+', '')).toBe(false);
    expect(regexAccepts('a+', 'aaa')).toBe(true);
    expect(regexAccepts('ab?', 'a')).toBe(true);
    expect(regexAccepts('ab?', 'ab')).toBe(true);
    expect(regexAccepts('ab?', 'abb')).toBe(false);
  });

  it.each(['a|', '*a', '(ab', 'ab)', '()', 'a||b'])('rejects malformed regex %s', (regex) => {
    expect(() => compileRegexToNFA(regex)).toThrow();
  });
});

describe('simulateTM', () => {
  it('increments a binary number', () => {
    const steps = simulateTM(binaryIncrementerTM, '1011');
    const last = steps[steps.length - 1];
    expect(last.status).toBe('ACCEPTED');
    expect(last.tapeState?.join('').replace(/B/g, '')).toBe('1100');
  });

  it('carries into a new leading digit', () => {
    const last = simulateTM(binaryIncrementerTM, '111').at(-1)!;
    expect(last.tapeState?.join('').replace(/B/g, '')).toBe('1000');
  });
});
