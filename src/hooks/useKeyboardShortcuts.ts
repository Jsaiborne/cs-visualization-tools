import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useAutomataStore } from '../store/useAutomataStore';
import { getActivePlayback } from '../store/activePlayback';

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Space', action: 'Play / pause' },
  { keys: '→ / ←', action: 'Step forward / back' },
  { keys: 'Home', action: 'Reset to step 1' },
  { keys: 'Ctrl/⌘ + Z', action: 'Undo (automata builder)' },
  { keys: 'Ctrl/⌘ + Shift + Z, Ctrl + Y', action: 'Redo (automata builder)' },
  { keys: 'Delete / Backspace', action: 'Delete selected state or edge' },
];

// Typing targets keep their keys; canvas nodes/edges keep arrow keys for nudging
const IGNORED_TARGETS =
  'input, textarea, select, [contenteditable="true"], .monaco-editor, .react-flow__node, .react-flow__edge';

/** Global playback and undo/redo shortcuts for whichever module is active. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey) return;
      if (e.target instanceof Element && e.target.closest(IGNORED_TARGETS)) return;
      // Dialogs own the keyboard while open
      if (document.querySelector('[role="dialog"]')) return;

      const { activeModule, compilerTab } = useUIStore.getState();
      const isAutomata = activeModule === 'AUTOMATA' || activeModule === 'REGEX';

      if (e.ctrlKey || e.metaKey) {
        if (!isAutomata) return;
        const key = e.key.toLowerCase();
        if ((key === 'z' && e.shiftKey) || key === 'y') {
          e.preventDefault();
          useAutomataStore.getState().redo();
        } else if (key === 'z') {
          e.preventDefault();
          useAutomataStore.getState().undo();
        }
        return;
      }

      const playback = getActivePlayback(activeModule, compilerTab);
      if (!playback || playback.stepCount === 0) return;
      const { state } = playback;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          state.setIsPlaying(!state.isPlaying);
          break;
        case 'ArrowRight':
          e.preventDefault();
          state.setIsPlaying(false);
          state.stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          state.setIsPlaying(false);
          state.stepBackward();
          break;
        case 'Home':
          e.preventDefault();
          state.reset();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
