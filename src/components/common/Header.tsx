import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  Cpu,
  Network,
  Binary,
  Code2,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Home,
  Share2,
  CheckCircle2,
  Library,
  Keyboard,
  Layers,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore, type ActiveModule } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';
import { useGrammarStore } from '../../store/useGrammarStore';
import { useScopeStore } from '../../store/useScopeStore';
import { useLRStore } from '../../store/useLRStore';
import { getShareableURL } from '../../utils/urlState';
import { BrandMark } from './BrandMark';

const LibraryPanel = lazy(() => import('./LibraryPanel'));
const ShortcutsHelp = lazy(() => import('./ShortcutsHelp'));

export const Header: React.FC = () => {
  const { activeModule, setActiveModule, toastMessage, showToast } = useUIStore(useShallow(state => ({
    activeModule: state.activeModule,
    setActiveModule: state.setActiveModule,
    toastMessage: state.toastMessage,
    showToast: state.showToast
  })));
  const compilerTab = useUIStore((state) => state.compilerTab);
  const [openDialog, setOpenDialog] = useState<'library' | 'shortcuts' | null>(null);
  
  const automataStore = useAutomataStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.executionSteps.length,
    stepForward: state.stepForward,
    stepBackward: state.stepBackward,
    reset: state.reset,
    playbackSpeedMs: state.playbackSpeedMs,
    hasValidationErrors: state.validationErrors.length > 0
  })));
  
  const grammarStore = useGrammarStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.executionSteps.length,
    stepForward: state.stepForward,
    stepBackward: state.stepBackward,
    reset: state.reset,
    playbackSpeedMs: state.playbackSpeedMs,
    hasValidationErrors: !!state.parseError
  })));
  
  const scopeStore = useScopeStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.scopeSteps.length,
    stepForward: state.stepForward,
    stepBackward: state.stepBackward,
    reset: state.reset,
    playbackSpeedMs: state.playbackSpeedMs,
    hasValidationErrors: !!state.parseError
  })));

  const lrStore = useLRStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.simulation.steps.length,
    stepForward: state.stepForward,
    stepBackward: state.stepBackward,
    reset: state.reset,
    playbackSpeedMs: state.playbackSpeedMs,
    hasValidationErrors: !!state.parseError
  })));

  const isScopeMode = activeModule === 'COMPILER_AST';
  // In the compiler module only the Symbol Table tab is step-based; tokens/AST/TAC are static views
  const hasPlayback = activeModule !== 'HOME' && (!isScopeMode || compilerTab === 'SYMBOL_TABLE');

  const activeStore =
    activeModule === 'GRAMMAR' ? grammarStore
    : activeModule === 'LR' ? lrStore
    : isScopeMode ? scopeStore
    : automataStore;

  const isPlaying = activeStore.isPlaying;
  const setIsPlaying = activeStore.setIsPlaying;
  const currentStepIndex = activeStore.currentStepIndex;
  const stepForward = activeStore.stepForward;
  const stepBackward = activeStore.stepBackward;
  const reset = activeStore.reset;
  const playbackSpeedMs = activeStore.playbackSpeedMs;
  const hasValidationErrors = activeStore.hasValidationErrors;

  const totalSteps = activeStore.totalSteps;

  // Auto-play: advance one step per tick; the effect re-arms after every step
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (currentStepIndex < totalSteps - 1) {
        stepForward();
      } else {
        setIsPlaying(false);
      }
    }, playbackSpeedMs);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeedMs, stepForward, setIsPlaying]);

  // Only the active module's store is driven by the timer, so pause everything on switch
  useEffect(() => {
    useAutomataStore.getState().setIsPlaying(false);
    useGrammarStore.getState().setIsPlaying(false);
    useScopeStore.getState().setIsPlaying(false);
    useLRStore.getState().setIsPlaying(false);
  }, [activeModule, compilerTab]);

  const handleShare = async () => {
    const url = await getShareableURL();
    window.history.replaceState(null, '', url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Shareable link copied to clipboard!');
      }).catch(() => {
        showToast('Share URL generated in browser bar!');
      });
    } else {
      showToast('Share URL generated in browser bar!');
    }
  };

  const modules: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
    { id: 'HOME', label: 'Home', icon: <Home size={15} /> },
    { id: 'AUTOMATA', label: 'Automata & TM', icon: <Network size={15} /> },
    { id: 'REGEX', label: 'Regex', icon: <Binary size={15} /> },
    { id: 'GRAMMAR', label: 'LL(1) Parsing', icon: <Cpu size={15} /> },
    { id: 'LR', label: 'LR Parsing', icon: <Layers size={15} /> },
    { id: 'COMPILER_AST', label: 'Compiler', icon: <Code2 size={15} /> },
  ];

  const playbackDisabled = hasValidationErrors || totalSteps === 0;

  return (
    <header
      className="app-header"
      style={{
        height: '52px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '60px',
            right: '16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
            boxShadow: 'var(--shadow-popover)',
          }}
        >
          <CheckCircle2 size={15} color="var(--success)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Brand */}
      <button
        onClick={() => setActiveModule('HOME')}
        title="TOC & Compiler Suite: home"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <BrandMark size={28} />
        <span className="header-wide-only" style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          TOC & Compiler Suite
        </span>
      </button>

      {/* Module tabs */}
      <nav className="tabs" role="tablist" aria-label="Modules" style={{ alignSelf: 'stretch' }}>
        {modules.map((m) => (
          <button
            key={m.id}
            id={`tab-module-${m.id.toLowerCase()}`}
            role="tab"
            aria-selected={activeModule === m.id}
            className="tab"
            onClick={() => setActiveModule(m.id)}
            style={{ padding: '0 12px' }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </nav>

      {/* Tools & playback */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={() => setOpenDialog('shortcuts')}
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
          style={{ padding: '6px 8px' }}
        >
          <Keyboard size={16} />
        </button>
        <button
          className="btn-ghost"
          onClick={() => setOpenDialog('library')}
          title="Save, load, import and export your work"
          style={{ padding: '6px 8px' }}
        >
          <Library size={16} />
          <span className="header-wide-only">Library</span>
        </button>
        <button
          className="btn-ghost"
          onClick={handleShare}
          title="Share serialized URL configuration"
          style={{ padding: '6px 8px' }}
        >
          <Share2 size={16} />
          <span className="header-wide-only">Share</span>
        </button>

        {hasPlayback && (
          <>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 8px' }} />
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                marginRight: '6px',
              }}
            >
              Step {currentStepIndex + 1} / {totalSteps || 1}
            </span>
            <button
              className="btn-ghost"
              onClick={reset}
              disabled={playbackDisabled}
              title="Reset to Step 0"
              style={{ padding: '6px 8px' }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              className="btn-ghost"
              onClick={stepBackward}
              disabled={playbackDisabled || currentStepIndex === 0}
              title="Step Backward"
              style={{ padding: '6px 8px' }}
            >
              <Rewind size={16} />
            </button>
            <button
              className="btn-primary"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={playbackDisabled}
              style={{ minWidth: '76px' }}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'Pause' : 'Run'}
            </button>
            <button
              className="btn-ghost"
              onClick={stepForward}
              disabled={playbackDisabled || currentStepIndex >= totalSteps - 1}
              title="Step Forward"
              style={{ padding: '6px 8px' }}
            >
              <FastForward size={16} />
            </button>
          </>
        )}
      </div>
      <Suspense fallback={null}>
        {openDialog === 'library' && <LibraryPanel onClose={() => setOpenDialog(null)} />}
        {openDialog === 'shortcuts' && <ShortcutsHelp onClose={() => setOpenDialog(null)} />}
      </Suspense>
    </header>
  );
};

export default Header;
