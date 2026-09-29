import { describe, it, expect } from 'vitest';
import { simulateDFA, simulateNFA } from '../automata';
import { compileRegexToNFA } from '../automata/regexCompiler';
import { nfaToDfa, DEAD_STATE_ID } from '../automata/subsetConstruction';
import { minimizeDfa } from '../automata/minimize';
import { compareAutomata } from '../automata/equivalence';
import { validateAutomaton, defaultDFA } from '../../store/useAutomataStore';
import type { DFAConfig, NFAConfig } from '../../types/automata';

const REGEXES = ['(0|1)*11', '(a|b)*abb', 'a(a|b)*b', '(00|11)*', 'a+b?', 'hello', '(ab|ba)*a'];

/** Every string over `alphabet` of length 0..maxLen. */
function allStrings(alphabet: string[], maxLen: number): string[] {
  let layer = [''];
  const out = [''];
  for (let len = 1; len <= maxLen; len++) {
    layer = layer.flatMap((w) => alphabet.map((a) => w + a));
    out.push(...layer);
  }
  return out;
}

const accepts = (m: DFAConfig | NFAConfig, w: string) =>
  (m.type === 'DFA' ? simulateDFA(m, w) : simulateNFA(m, w)).at(-1)!.status === 'ACCEPTED';

describe('nfaToDfa (subset construction)', () => {
  it.each(REGEXES)('agrees with the NFA of %s on every string up to length 8', (regex) => {
    const nfa = compileRegexToNFA(regex);
    const { dfa } = nfaToDfa(nfa);
    const alphabet = dfa.alphabet.length > 2 ? dfa.alphabet.slice(0, 3) : dfa.alphabet;
    const maxLen = alphabet.length > 2 ? 6 : 8;
    for (const w of allStrings(alphabet, maxLen)) {
      expect(accepts(dfa, w), `${regex} on "${w}"`).toBe(accepts(nfa, w));
    }
  });

  it('produces a valid, complete DFA with short names mapped to NFA state sets', () => {
    const { dfa, steps, stateSets, setLabels } = nfaToDfa(compileRegexToNFA('(a|b)*abb'));
    expect(validateAutomaton(dfa)).toEqual([]);
    expect(dfa.states.map((s) => s.label)).toEqual(['D0', 'D1', 'D2', 'D3', 'D4']);
    expect(setLabels.D0).toMatch(/^\{q\d+(,q\d+)*\}$/);
    expect(steps.length).toBe(dfa.states.length - (stateSets[DEAD_STATE_ID] ? 1 : 0));
    expect(dfa.regex).toBe('(a|b)*abb');
  });

  it('adds a dead state only when some move is missing', () => {
    expect(nfaToDfa(compileRegexToNFA('ab')).dfa.states.some((s) => s.id === DEAD_STATE_ID)).toBe(true);
    expect(nfaToDfa(compileRegexToNFA('(a|b)*')).dfa.states.some((s) => s.id === DEAD_STATE_ID)).toBe(false);
  });
});

describe('minimizeDfa', () => {
  it.each([
    ['(0|1)*11', 3],
    ['(a|b)*abb', 4],
    ['a(a|b)*b', 4],
    ['(00|11)*', 4],
    ['(a|b)*', 1],
  ])('minimal DFA for %s has %i states and the same language', (regex, count) => {
    const nfa = compileRegexToNFA(regex);
    const { dfa: min } = minimizeDfa(nfaToDfa(nfa).dfa);
    expect(min.states).toHaveLength(count);
    expect(validateAutomaton(min)).toEqual([]);
    expect(compareAutomata(min, nfa).equivalent).toBe(true);
  });

  it('removes unreachable states and records refinement rounds', () => {
    const withJunk: DFAConfig = {
      ...defaultDFA,
      states: [...defaultDFA.states, { id: 'q9', label: 'q9', isStart: false, isAccept: false }],
      transitions: [
        ...defaultDFA.transitions,
        { id: 'j0', from: 'q9', to: 'q0', symbol: '0' },
        { id: 'j1', from: 'q9', to: 'q9', symbol: '1' },
      ],
    };
    const result = minimizeDfa(withJunk);
    expect(result.unreachable).toEqual(['q9']);
    expect(result.dfa.states).toHaveLength(2);
    expect(result.rounds[0].blocks).toHaveLength(2);
  });

  it('merges equivalent states and reports the splitting symbol', () => {
    // q1 and q2 both accept everything after them: they must merge
    const redundant: DFAConfig = {
      id: 'r',
      name: 'r',
      type: 'DFA',
      alphabet: ['a', 'b'],
      startStateId: 'q0',
      acceptStateIds: ['q1', 'q2'],
      states: ['q0', 'q1', 'q2'].map((id) => ({ id, label: id, isStart: id === 'q0', isAccept: id !== 'q0' })),
      transitions: [
        { id: '1', from: 'q0', to: 'q1', symbol: 'a' },
        { id: '2', from: 'q0', to: 'q2', symbol: 'b' },
        { id: '3', from: 'q1', to: 'q2', symbol: 'a' },
        { id: '4', from: 'q1', to: 'q1', symbol: 'b' },
        { id: '5', from: 'q2', to: 'q1', symbol: 'a' },
        { id: '6', from: 'q2', to: 'q2', symbol: 'b' },
      ],
    };
    const { dfa, mergedFrom } = minimizeDfa(redundant);
    expect(dfa.states).toHaveLength(2);
    expect(Object.values(mergedFrom)).toContainEqual(['q1', 'q2']);
    expect(dfa.states.map((s) => s.label)).toContain('{q1,q2}');
  });

  it('completes an incomplete DFA with a dead state before minimizing', () => {
    const partial: DFAConfig = {
      id: 'p',
      name: 'p',
      type: 'DFA',
      alphabet: ['a', 'b'],
      startStateId: 'q0',
      acceptStateIds: ['q1'],
      states: ['q0', 'q1'].map((id) => ({ id, label: id, isStart: id === 'q0', isAccept: id === 'q1' })),
      transitions: [{ id: '1', from: 'q0', to: 'q1', symbol: 'a' }],
    };
    const { dfa } = minimizeDfa(partial);
    expect(dfa.states).toHaveLength(3);
    expect(validateAutomaton(dfa)).toEqual([]);
    expect(compareAutomata(dfa, partial).equivalent).toBe(true);
  });
});

describe('compareAutomata', () => {
  const re = compileRegexToNFA;

  it('finds equal languages written differently', () => {
    expect(compareAutomata(re('(a|b)*'), re('(a*b*)*'))).toEqual({ equivalent: true });
    expect(compareAutomata(re('a(ba)*'), re('(ab)*a')).equivalent).toBe(true);
  });

  it('returns the shortest distinguishing string and who accepts it', () => {
    expect(compareAutomata(re('(0|1)*'), re('(0|1)*1'))).toEqual({
      equivalent: false,
      counterexample: '',
      acceptedBy: 'first',
    });
    expect(compareAutomata(re('a*'), re('a*b?'))).toEqual({
      equivalent: false,
      counterexample: 'b',
      acceptedBy: 'second',
    });
    expect(compareAutomata(re('(a|b)*abb'), re('(a|b)*bb'))).toMatchObject({ counterexample: 'bb', acceptedBy: 'second' });
  });

  it('compares a DFA against an NFA over different alphabets', () => {
    expect(compareAutomata(defaultDFA, re('(1|01*0)*')).equivalent).toBe(true);
    expect(compareAutomata(defaultDFA, re('(1|01*0|2)*'))).toMatchObject({ counterexample: '2', acceptedBy: 'second' });
  });
});
