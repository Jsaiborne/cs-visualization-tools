import React from 'react';
import { PlusCircle, PlayCircle, CheckCircle2, Trash2, Undo2, Redo2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import { ExportMenu } from './ExportMenu';
import { useCanvasImageExport } from '../../hooks/useCanvasImageExport';

const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

interface BuilderToolbarProps {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  selectedNodeId,
  selectedEdgeId,
}) => {
  const {
    addState,
    setStartState,
    toggleAcceptState,
    removeElement,
    undo,
    redo,
    canUndo,
    canRedo,
    automaton,
  } = useAutomataStore(
    useShallow((state) => ({
      addState: state.addState,
      setStartState: state.setStartState,
      toggleAcceptState: state.toggleAcceptState,
      removeElement: state.removeElement,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      automaton: state.automaton,
    }))
  );
  const exportImage = useCanvasImageExport();

  const handleAddState = () => {
    // Generate position with slight offset
    const randomOffset = Math.floor(Math.random() * 80);
    addState(undefined, 250 + randomOffset, 200 + randomOffset);
  };

  const handleSetStart = () => {
    if (selectedNodeId) {
      setStartState(selectedNodeId);
    }
  };

  const handleToggleAccept = () => {
    if (selectedNodeId) {
      toggleAcceptState(selectedNodeId);
    }
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      removeElement(selectedNodeId);
    } else if (selectedEdgeId) {
      removeElement(selectedEdgeId);
    }
  };

  const hasSelection = Boolean(selectedNodeId || selectedEdgeId);

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px',
        zIndex: 10,
      }}
    >
      {/* Undo / Redo */}
      <button
        className="btn-ghost"
        onClick={undo}
        disabled={!canUndo}
        title={`Undo (${MOD_KEY}+Z)`}
        aria-label="Undo"
        style={{ padding: '6px 8px' }}
      >
        <Undo2 size={15} />
      </button>
      <button
        className="btn-ghost"
        onClick={redo}
        disabled={!canRedo}
        title={`Redo (${MOD_KEY}+Shift+Z)`}
        aria-label="Redo"
        style={{ padding: '6px 8px' }}
      >
        <Redo2 size={15} />
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

      {/* Add State Button */}
      <button
        className="btn-ghost"
        onClick={handleAddState}
        title="Add New State"
        style={{ padding: '6px 10px', fontSize: '12px' }}
      >
        <PlusCircle size={15} />
        <span className="canvas-toolbar-label">+ State</span>
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

      {/* Set Start State Button */}
      <button
        className="btn-ghost"
        onClick={handleSetStart}
        disabled={!selectedNodeId}
        title={selectedNodeId ? `Set '${selectedNodeId}' as Start State` : 'Select a node first'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
        }}
      >
        <PlayCircle size={15} />
        <span className="canvas-toolbar-label">Make Start</span>
      </button>

      {/* Toggle Accept State Button */}
      <button
        className="btn-ghost"
        onClick={handleToggleAccept}
        disabled={!selectedNodeId}
        title={selectedNodeId ? `Toggle Accept state for '${selectedNodeId}'` : 'Select a node first'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
        }}
      >
        <CheckCircle2 size={15} />
        <span className="canvas-toolbar-label">Toggle Accept</span>
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

      {/* Delete Selected Element Button */}
      <button
        className="btn-ghost"
        onClick={handleDelete}
        disabled={!hasSelection}
        title={hasSelection ? 'Delete selected state/edge' : 'Select a node or edge to delete'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          color: hasSelection ? 'var(--danger)' : 'var(--text-muted)',
        }}
      >
        <Trash2 size={15} />
        <span className="canvas-toolbar-label">Delete</span>
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

      <ExportMenu automaton={automaton} onImage={exportImage} />
    </div>
  );
};
