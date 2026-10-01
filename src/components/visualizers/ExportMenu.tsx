import React, { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import type { AutomatonDefinition } from '../../types/automata';
import { toTikz, toDot } from '../../core/automata/export';
import { downloadText, slugify } from '../../utils/download';
import type { ImageFormat } from '../../hooks/useCanvasImageExport';
import { useUIStore } from '../../store/useUIStore';

interface ExportMenuProps {
  automaton: AutomatonDefinition;
  /** Provided only where a canvas exists (not in Turing machine mode). */
  onImage?: (format: ImageFormat, filename: string) => Promise<void>;
}

/** Export dropdown: canvas images plus TikZ and Graphviz source for reports. */
export const ExportMenu: React.FC<ExportMenuProps> = ({ automaton, onImage }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const showToast = useUIStore((state) => state.showToast);
  const base = slugify(automaton.name, 'automaton');

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  const run = (action: () => unknown) => async () => {
    setOpen(false);
    try {
      await action();
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. See the console for details.');
    }
  };

  const items: { label: string; action: () => unknown }[] = [
    ...(onImage
      ? [
          { label: 'PNG image', action: () => onImage('png', `${base}.png`) },
          { label: 'SVG image', action: () => onImage('svg', `${base}.svg`) },
        ]
      : []),
    { label: 'TikZ (.tex)', action: () => downloadText(`${base}.tex`, toTikz(automaton), 'application/x-tex') },
    {
      label: 'Copy TikZ',
      action: async () => {
        await navigator.clipboard.writeText(toTikz(automaton));
        showToast('TikZ copied to clipboard');
      },
    },
    { label: 'Graphviz (.dot)', action: () => downloadText(`${base}.dot`, toDot(automaton), 'text/vnd.graphviz') },
  ];

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="btn-ghost"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export the diagram"
        style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }}
      >
        <Download size={15} />
        <span className="canvas-toolbar-label">Export</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div
          role="menu"
          className="panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '170px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            boxShadow: 'var(--shadow-popover)',
            background: 'var(--surface)',
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={run(item.action)}
              style={{
                textAlign: 'left',
                padding: '7px 10px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
