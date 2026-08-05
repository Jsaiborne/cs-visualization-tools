import React from 'react';
import { PlusCircle, PlayCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useAutomataStore } from '../../store/useAutomataStore';

interface BuilderToolbarProps {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  selectedNodeId,
  selectedEdgeId,
}) => {
  const { addState, setStartState, toggleAcceptState, removeElement } = useAutomataStore();

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
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        zIndex: 10,
        boxShadow: 'var(--shadow-glass)',
        backdropFilter: 'var(--glass-backdrop)',
        WebkitBackdropFilter: 'var(--glass-backdrop)',
      }}
    >
      {/* Add State Button */}
      <button
        className="btn-secondary"
        onClick={handleAddState}
        title="Add New State"
        style={{ padding: '6px 10px', fontSize: '12px' }}
      >
        <PlusCircle size={15} color="var(--accent-emerald)" />
        <span>+ State</span>
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 4px' }} />

      {/* Set Start State Button */}
      <button
        className="btn-secondary"
        onClick={handleSetStart}
        disabled={!selectedNodeId}
        title={selectedNodeId ? `Set '${selectedNodeId}' as Start State` : 'Select a node first'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          opacity: selectedNodeId ? 1 : 0.4,
          cursor: selectedNodeId ? 'pointer' : 'not-allowed',
        }}
      >
        <PlayCircle size={15} color="var(--accent-blue)" />
        <span>Make Start</span>
      </button>

      {/* Toggle Accept State Button */}
      <button
        className="btn-secondary"
        onClick={handleToggleAccept}
        disabled={!selectedNodeId}
        title={selectedNodeId ? `Toggle Accept state for '${selectedNodeId}'` : 'Select a node first'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          opacity: selectedNodeId ? 1 : 0.4,
          cursor: selectedNodeId ? 'pointer' : 'not-allowed',
        }}
      >
        <CheckCircle2 size={15} color="var(--accent-purple)" />
        <span>Toggle Accept</span>
      </button>

      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 4px' }} />

      {/* Delete Selected Element Button */}
      <button
        className="btn-secondary"
        onClick={handleDelete}
        disabled={!hasSelection}
        title={hasSelection ? 'Delete selected state/edge' : 'Select a node or edge to delete'}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          opacity: hasSelection ? 1 : 0.4,
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          borderColor: hasSelection ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)',
          color: hasSelection ? 'var(--accent-rose)' : 'var(--text-secondary)',
        }}
      >
        <Trash2 size={15} />
        <span>Delete</span>
      </button>
    </div>
  );
};
