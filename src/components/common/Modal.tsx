import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

/**
 * Centered dialog over a dimmed backdrop. Closes on Escape or a backdrop click.
 * Rendered into document.body so ancestors' stacking contexts (z-index) can't trap it.
 */
export const Modal: React.FC<ModalProps> = ({ title, onClose, width = 520, children }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel"
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{title}</h3>
          <button
            className="btn-ghost"
            onClick={onClose}
            aria-label="Close"
            style={{ padding: '4px 6px' }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '16px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
