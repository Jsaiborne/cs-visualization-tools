import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { useUIStore, type ActiveModule } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';
import { useGrammarStore } from '../../store/useGrammarStore';
import { useScopeStore } from '../../store/useScopeStore';
import { getShareableURL } from '../../utils/urlState';

export const Header: React.FC = () => {
  const { activeModule, setActiveModule, toastMessage, showToast } = useUIStore();
  const automataStore = useAutomataStore();
  const grammarStore = useGrammarStore();
  const scopeStore = useScopeStore();

  const isGrammarMode = activeModule === 'GRAMMAR';
  const isScopeMode = activeModule === 'COMPILER_AST';

  const isPlaying = isGrammarMode
    ? grammarStore.isPlaying
    : isScopeMode
    ? scopeStore.isPlaying
    : automataStore.isPlaying;
  const setIsPlaying = isGrammarMode
    ? grammarStore.setIsPlaying
    : isScopeMode
    ? scopeStore.setIsPlaying
    : automataStore.setIsPlaying;
  const currentStepIndex = isGrammarMode
    ? grammarStore.currentStepIndex
    : isScopeMode
    ? scopeStore.currentStepIndex
    : automataStore.currentStepIndex;
  const executionSteps = isGrammarMode
    ? grammarStore.executionSteps
    : isScopeMode
    ? scopeStore.scopeSteps
    : automataStore.executionSteps;
  const stepForward = isGrammarMode
    ? grammarStore.stepForward
    : isScopeMode
    ? scopeStore.stepForward
    : automataStore.stepForward;
  const stepBackward = isGrammarMode
    ? grammarStore.stepBackward
    : isScopeMode
    ? scopeStore.stepBackward
    : automataStore.stepBackward;
  const reset = isGrammarMode
    ? grammarStore.reset
    : isScopeMode
    ? scopeStore.reset
    : automataStore.reset;
  const playbackSpeedMs = isGrammarMode
    ? grammarStore.playbackSpeedMs
    : isScopeMode
    ? scopeStore.playbackSpeedMs
    : automataStore.playbackSpeedMs;
  const hasValidationErrors = isGrammarMode
    ? !!grammarStore.parseError
    : isScopeMode
    ? !!scopeStore.parseError
    : automataStore.validationErrors.length > 0;

  const totalSteps = executionSteps.length;

  // Auto-play timer effect for simulation playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentStepIndex < totalSteps - 1) {
          stepForward();
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeedMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeedMs, stepForward, setIsPlaying]);

  const handleShare = () => {
    const url = getShareableURL();
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
    { id: 'HOME', label: 'Home Hub', icon: <Home size={18} /> },
    { id: 'AUTOMATA', label: 'Finite Automata & TM', icon: <Network size={18} /> },
    { id: 'REGEX', label: 'Regex & Thompson', icon: <Binary size={18} /> },
    { id: 'GRAMMAR', label: 'CFG & Parsing', icon: <Cpu size={18} /> },
    { id: 'COMPILER_AST', label: 'Compiler AST & IR', icon: <Code2 size={18} /> },
  ];

  return (
    <header
      className="glass-header"
      style={{
        height: '60px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--accent-blue)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
            animation: 'fadeIn 200ms ease',
          }}
        >
          <CheckCircle2 size={16} color="var(--accent-blue)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Brand & Title */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => setActiveModule('HOME')}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Cpu size={22} color="#ffffff" />
        </div>
        <div>
          <h1
            style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}
            className="gradient-text"
          >
            TOC & Compiler Suite
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            Interactive Theory of Computation Platform
          </p>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {modules.map((m) => (
          <button
            key={m.id}
            id={`tab-module-${m.id.toLowerCase()}`}
            onClick={() => setActiveModule(m.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: activeModule === m.id ? 600 : 400,
              cursor: 'pointer',
              background: activeModule === m.id ? 'var(--gradient-primary)' : 'transparent',
              color: activeModule === m.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 200ms ease',
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </nav>

      {/* Controls & Share Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Share Button */}
        <button
          className="btn-secondary"
          onClick={handleShare}
          title="Share serialized URL configuration"
          style={{ padding: '7px 12px', fontSize: '12px', gap: '6px' }}
        >
          <Share2 size={15} color="var(--accent-blue)" />
          <span>Share</span>
        </button>

        {activeModule !== 'HOME' && (
          <>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-blue)',
                fontWeight: 600,
              }}
            >
              Step {currentStepIndex + 1} / {totalSteps || 1}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn-secondary"
                onClick={reset}
                disabled={hasValidationErrors}
                title="Reset to Step 0"
                style={{ padding: '8px 10px', opacity: hasValidationErrors ? 0.5 : 1 }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="btn-secondary"
                onClick={stepBackward}
                disabled={hasValidationErrors || currentStepIndex === 0}
                title="Step Backward"
                style={{ padding: '8px 10px', opacity: hasValidationErrors || currentStepIndex === 0 ? 0.5 : 1 }}
              >
                <Rewind size={16} />
              </button>
              <button
                className="btn-primary"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={hasValidationErrors}
                style={{
                  minWidth: '85px',
                  opacity: hasValidationErrors ? 0.5 : 1,
                  cursor: hasValidationErrors ? 'not-allowed' : 'pointer',
                }}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                {isPlaying ? 'Pause' : 'Run'}
              </button>
              <button
                className="btn-secondary"
                onClick={stepForward}
                disabled={hasValidationErrors || currentStepIndex >= totalSteps - 1}
                title="Step Forward"
                style={{ padding: '8px 10px', opacity: hasValidationErrors || currentStepIndex >= totalSteps - 1 ? 0.5 : 1 }}
              >
                <FastForward size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
