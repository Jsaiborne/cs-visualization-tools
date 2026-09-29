import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listEntries,
  saveEntry,
  renameEntry,
  deleteEntry,
  exportEntries,
  parseImport,
  importEntries,
} from '../library';
import { defaultDFA } from '../../store/useAutomataStore';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('save library', () => {
  it('saves, lists newest first, renames and deletes', () => {
    const a = saveEntry('Even zeros', 'AUTOMATA', { automaton: defaultDFA, testInput: '10' });
    const b = saveEntry('  ', 'GRAMMAR', { grammarText: 'S -> a', testInput: 'a' });
    expect(b.name).toBe('Untitled');
    expect(listEntries().map((e) => e.id)).toEqual(
      [a, b].sort((x, y) => y.savedAt.localeCompare(x.savedAt)).map((e) => e.id)
    );

    renameEntry(a.id, 'Even number of zeros');
    expect(listEntries().find((e) => e.id === a.id)?.name).toBe('Even number of zeros');

    deleteEntry(b.id);
    expect(listEntries().map((e) => e.id)).toEqual([a.id]);
  });

  it('persists to localStorage', () => {
    saveEntry('Even zeros', 'AUTOMATA', { automaton: defaultDFA });
    expect(JSON.parse(localStorage.getItem('cs-viz-library')!)).toHaveLength(1);
  });

  it('ignores malformed data in storage', () => {
    localStorage.setItem('cs-viz-library', JSON.stringify([{ id: 1 }, 'junk', null]));
    expect(listEntries()).toEqual([]);
    localStorage.setItem('cs-viz-library', '{not json');
    expect(() => listEntries()).not.toThrow();
  });

  it('keeps working in memory when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const entry = saveEntry('Session only', 'GRAMMAR', { grammarText: 'S -> a' });
    expect(listEntries().map((e) => e.id)).toContain(entry.id);
  });
});

describe('import / export', () => {
  it('round-trips through the export format with fresh ids', () => {
    const entry = saveEntry('Even zeros', 'AUTOMATA', { automaton: defaultDFA, testInput: '10' });
    const imported = parseImport(exportEntries([entry]));
    expect(imported).toHaveLength(1);
    expect(imported[0]).toMatchObject({ name: entry.name, module: 'AUTOMATA', payload: entry.payload });
    expect(imported[0].id).not.toBe(entry.id);

    expect(importEntries(imported)).toBe(1);
    expect(listEntries()).toHaveLength(2);
  });

  it('rejects files that are not library exports', () => {
    expect(() => parseImport('{oops')).toThrow(/not valid JSON/);
    expect(() => parseImport('{"hello": 1}')).toThrow(/not a library export/);
    expect(() => parseImport('[{"name": "x", "module": "NOPE"}]')).toThrow(/No valid saved items/);
  });
});
