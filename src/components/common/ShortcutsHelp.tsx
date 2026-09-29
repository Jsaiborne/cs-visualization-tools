import React from 'react';
import { Modal } from './Modal';
import { SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

export const ShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Modal title="Keyboard shortcuts" onClose={onClose} width={420}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <tbody>
        {SHORTCUTS.map(({ keys, action }) => (
          <tr key={keys} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <td style={{ padding: '8px 12px 8px 0', whiteSpace: 'nowrap' }}>
              <kbd
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(30, 41, 59, 0.6)',
                }}
              >
                {keys}
              </kbd>
            </td>
            <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
      Shortcuts are paused while you are typing in an input or editor.
    </p>
  </Modal>
);

export default ShortcutsHelp;
