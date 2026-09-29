import { describe, it, expect } from 'vitest';
import { serializeState, deserializeState } from '../urlState';
import { defaultDFA } from '../../store/useAutomataStore';

describe('share-link state encoding', () => {
  it('round-trips through a compact, URL-safe string', async () => {
    const payload = { automaton: defaultDFA, testInput: '10010', note: 'ε → ✓' };
    const encoded = await serializeState(payload);
    expect(encoded).toMatch(/^z\.[A-Za-z0-9_-]+$/);
    expect(await deserializeState(encoded)).toEqual(payload);
  });

  it('is shorter than the legacy encoding', async () => {
    const payload = { automaton: defaultDFA };
    const legacy = btoa(encodeURIComponent(JSON.stringify(payload)));
    expect((await serializeState(payload)).length).toBeLessThan(legacy.length / 2);
  });

  it('still reads legacy links', async () => {
    const payload = { grammarText: 'S -> a S | ε', testInput: 'a a' };
    const legacy = btoa(encodeURIComponent(JSON.stringify(payload)));
    expect(await deserializeState(legacy)).toEqual(payload);
  });

  it('returns null for garbage', async () => {
    expect(await deserializeState('z.not-valid')).toBeNull();
  });
});
