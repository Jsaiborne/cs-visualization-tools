import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomataStore, defaultDFA, defaultTM } from '../useAutomataStore';
import type { DFAConfig } from '../../types/automata';

const store = () => useAutomataStore.getState();
const dfa = () => store().automaton as DFAConfig;

beforeEach(() => {
  store().setTestInput('10010');
  store().setAutomaton(defaultDFA);
});

describe('automata builder actions', () => {
  it('never reuses a state id after a deletion', () => {
    store().addState();
    store().addState();
    expect(dfa().states.map((s) => s.id)).toEqual(['q0', 'q1', 'q2', 'q3']);
    store().removeElement('q2');
    store().addState();
    const ids = dfa().states.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('q2');
  });

  it('deletes edges by id', () => {
    store().removeElement('t0');
    expect(dfa().transitions.map((t) => t.id)).not.toContain('t0');
  });

  it('drops a deleted state from the accept set', () => {
    store().removeElement('q0');
    expect(dfa().acceptStateIds).toEqual([]);
    expect(store().validationErrors.join(' ')).not.toMatch(/missing from states/);
  });

  it('resets the step index when an edit shortens the trace', () => {
    store().setStepIndex(4);
    store().addState();
    expect(store().currentStepIndex).toBe(0);
    expect(store().executionSteps).toEqual([]);
  });

  it('adds new edge symbols to the alphabet and splits comma lists', () => {
    store().addEdge('q0', 'q1', 'a, b');
    expect(dfa().alphabet).toEqual(['0', '1', 'a', 'b']);
    expect(dfa().transitions.filter((t) => t.from === 'q0' && t.to === 'q1').map((t) => t.symbol)).toEqual([
      '0',
      'a',
      'b',
    ]);
  });

  it('keeps a single accept state on a Turing machine', () => {
    store().setAutomaton(defaultTM);
    store().toggleAcceptState('q0');
    const tm = store().automaton;
    expect(tm.type === 'TM' && tm.acceptStateId).toBe('q0');
    expect(tm.states.filter((s) => s.isAccept).map((s) => s.id)).toEqual(['q0']);
  });
});
