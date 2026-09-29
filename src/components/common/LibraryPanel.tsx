import React, { useRef, useState } from 'react';
import { Save, Upload, Download, Trash2, Pencil, FolderOpen, Check } from 'lucide-react';
import { Modal } from './Modal';
import { useUIStore } from '../../store/useUIStore';
import { captureModuleState, applyModuleState, MODULE_LABELS, ACTIVE_MODULES } from '../../utils/moduleState';
import {
  listEntries,
  saveEntry,
  renameEntry,
  deleteEntry,
  exportEntries,
  parseImport,
  importEntries,
  type LibraryEntry,
} from '../../utils/library';
import { downloadText, slugify } from '../../utils/download';

interface LibraryPanelProps {
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '7px 10px',
  fontSize: '13px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  outline: 'none',
};

const iconButton: React.CSSProperties = { padding: '5px 7px', fontSize: '12px' };

/** Save, load, rename, delete, export and import saved work across all modules. */
export const LibraryPanel: React.FC<LibraryPanelProps> = ({ onClose }) => {
  const activeModule = useUIStore((state) => state.activeModule);
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const showToast = useUIStore((state) => state.showToast);

  const [entries, setEntries] = useState<LibraryEntry[]>(listEntries);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const refresh = () => setEntries(listEntries());
  const canSave = captureModuleState(activeModule) !== null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = captureModuleState(activeModule);
    if (!payload) return;
    const entry = saveEntry(saveName, activeModule, payload);
    setSaveName('');
    refresh();
    setMessage({ text: `Saved "${entry.name}".`, isError: false });
  };

  const handleLoad = (entry: LibraryEntry) => {
    setActiveModule(entry.module);
    if (applyModuleState(entry.module, entry.payload)) {
      showToast(`Loaded "${entry.name}"`);
      onClose();
    } else {
      setMessage({ text: `"${entry.name}" could not be loaded: its saved data is incomplete.`, isError: true });
    }
  };

  const commitRename = (id: string) => {
    renameEntry(id, editName);
    setEditingId(null);
    refresh();
  };

  const handleDelete = (entry: LibraryEntry) => {
    if (!window.confirm(`Delete "${entry.name}" from the library?`)) return;
    deleteEntry(entry.id);
    refresh();
  };

  const handleImport = async (file: File) => {
    try {
      const imported = parseImport(await file.text());
      importEntries(imported);
      refresh();
      setMessage({ text: `Imported ${imported.length} item${imported.length === 1 ? '' : 's'}.`, isError: false });
    } catch (err) {
      setMessage({ text: (err as Error).message, isError: true });
    }
  };

  const grouped = ACTIVE_MODULES.map((module) => ({
    module,
    items: entries.filter((e) => e.module === module),
  })).filter((g) => g.items.length > 0);

  return (
    <Modal title="Library" onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Save current work */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {canSave ? (
              <>
                Save the current <strong>{MODULE_LABELS[activeModule]}</strong> work
              </>
            ) : (
              'Open a module to save its work.'
            )}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name, e.g. Ends with abb"
              disabled={!canSave}
              aria-label="Name for the saved item"
              style={inputStyle}
            />
            <button className="btn-primary" type="submit" disabled={!canSave} style={{ padding: '7px 14px', fontSize: '13px' }}>
              <Save size={14} /> Save
            </button>
          </div>
        </form>

        {message && (
          <div
            role="status"
            style={{
              fontSize: '12px',
              padding: '8px 10px',
              borderRadius: '6px',
              color: message.isError ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              background: message.isError ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            }}
          >
            {message.text}
          </div>
        )}

        {/* Saved items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {grouped.length === 0 && (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              Nothing saved yet. Saved items stay in this browser; export them to move them elsewhere.
            </p>
          )}
          {grouped.map(({ module, items }) => (
            <section key={module}>
              <h4 style={{ margin: '0 0 6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {MODULE_LABELS[module]}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {editingId === entry.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          commitRename(entry.id);
                        }}
                        style={{ display: 'flex', gap: '6px', flex: 1 }}
                      >
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="New name"
                          style={inputStyle}
                        />
                        <button className="btn-secondary" type="submit" title="Save name" style={iconButton}>
                          <Check size={14} />
                        </button>
                      </form>
                    ) : (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(entry.savedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    <button className="btn-primary" onClick={() => handleLoad(entry)} title="Load" style={{ ...iconButton, gap: '4px' }}>
                      <FolderOpen size={14} /> Load
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditName(entry.name);
                      }}
                      title="Rename"
                      aria-label={`Rename ${entry.name}`}
                      style={iconButton}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => downloadText(`${slugify(entry.name)}.json`, exportEntries([entry]), 'application/json')}
                      title="Export as .json"
                      aria-label={`Export ${entry.name}`}
                      style={iconButton}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDelete(entry)}
                      title="Delete"
                      aria-label={`Delete ${entry.name}`}
                      style={{ ...iconButton, color: 'var(--accent-rose)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Import / export all */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
          <button className="btn-secondary" onClick={() => fileInput.current?.click()} style={{ padding: '7px 12px', fontSize: '12px' }}>
            <Upload size={14} /> Import .json
          </button>
          <button
            className="btn-secondary"
            onClick={() => downloadText('cs-viz-library.json', exportEntries(entries), 'application/json')}
            disabled={entries.length === 0}
            style={{ padding: '7px 12px', fontSize: '12px', opacity: entries.length === 0 ? 0.5 : 1 }}
          >
            <Download size={14} /> Export all
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LibraryPanel;
