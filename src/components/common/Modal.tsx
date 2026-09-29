import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}

/** Centered glass dialog over a dimmed backdrop. Closes on Escape or a backdrop click. */
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

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(6px)',
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
        className="glass-panel"
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-glass)',
          background: 'rgba(15, 23, 42, 0.97)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{title}</h3>
          <button
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close"
            style={{ padding: '4px 6px' }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
