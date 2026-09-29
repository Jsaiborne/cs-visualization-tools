import type { ActiveModule } from '../store/useUIStore';
import { isActiveModule } from './moduleState';

/** A saved piece of work: a module plus the snapshot from captureModuleState. */
export interface LibraryEntry {
  id: string;
  name: string;
  module: ActiveModule;
  savedAt: string; // ISO timestamp
  payload: Record<string, unknown>;
}

const STORAGE_KEY = 'cs-viz-library';
const EXPORT_FORMAT = 'cs-viz-library/v1';

// Used when localStorage is unavailable (private mode, blocked storage): the library still
// works for the session, it just isn't persisted.
let memoryCopy: LibraryEntry[] = [];

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keeps only well-formed entries; anything else in storage or an import is dropped. */
function sanitize(value: unknown): LibraryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (e): e is LibraryEntry =>
      isRecord(e) &&
      typeof e.id === 'string' &&
      typeof e.name === 'string' &&
      isActiveModule(e.module) &&
      typeof e.savedAt === 'string' &&
      isRecord(e.payload)
  );
}

function read(): LibraryEntry[] {
  try {
    if (!globalThis.localStorage) return memoryCopy;
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw == null ? [] : sanitize(JSON.parse(raw));
  } catch {
    return memoryCopy;
  }
}

/** Returns false when the entries could only be kept in memory. */
function write(entries: LibraryEntry[]): boolean {
  memoryCopy = entries;
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/** All saved entries, newest first. */
export function listEntries(): LibraryEntry[] {
  return [...read()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function saveEntry(name: string, module: ActiveModule, payload: Record<string, unknown>): LibraryEntry {
  const entry: LibraryEntry = {
    id: newId(),
    name: name.trim() || 'Untitled',
    module,
    savedAt: new Date().toISOString(),
    payload,
  };
  write([...read(), entry]);
  return entry;
}

export function renameEntry(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  write(read().map((e) => (e.id === id ? { ...e, name: trimmed } : e)));
}

export function deleteEntry(id: string) {
  write(read().filter((e) => e.id !== id));
}

/** Serializes entries to the JSON file format used by export/import. */
export function exportEntries(entries: LibraryEntry[]): string {
  return JSON.stringify({ format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), entries }, null, 2);
}

/**
 * Parses an exported file (or a bare array of entries). Throws with a readable message when the
 * file isn't a library export. Imported entries get fresh ids so they never overwrite existing ones.
 */
export function parseImport(json: string): LibraryEntry[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const rawEntries = isRecord(data) && data.format === EXPORT_FORMAT ? data.entries : data;
  if (!Array.isArray(rawEntries)) {
    throw new Error('This file is not a library export.');
  }
  const entries = sanitize(rawEntries);
  if (entries.length === 0) {
    throw new Error('No valid saved items were found in this file.');
  }
  return entries.map((e) => ({ ...e, id: newId() }));
}

/** Adds imported entries to the library; returns how many were added. */
export function importEntries(entries: LibraryEntry[]): number {
  write([...read(), ...entries]);
  return entries.length;
}
