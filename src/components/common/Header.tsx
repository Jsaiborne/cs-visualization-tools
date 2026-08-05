import React, { useEffect } from 'react';
import { Cpu, Network, Binary, Code2, Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { useUIStore, type ActiveModule } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';

export const Header: React.FC = () => {
  const { activeModule, setActiveModule } = useUIStore();
  const {
    isPlaying,
    setIsPlaying,
    currentStepIndex,
    executionSteps,
    stepForward,
    stepBackward,
    reset,
    playbackSpeedMs
  } = useAutomataStore();

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

  const modules: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
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
        zIndex: 10
      }}
    >
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
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
            Interactive Theory of Computation & Compiler Visualizer
          </p>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
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
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeModule === m.id ? 600 : 400,
              cursor: 'pointer',
              background: activeModule === m.id ? 'var(--gradient-primary)' : 'transparent',
              color: activeModule === m.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 200ms ease'
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </nav>

      {/* Time-Travel Controls & Step Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-blue)',
            fontWeight: 600
          }}
        >
          Step {currentStepIndex + 1} / {totalSteps || 1}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={reset}
            title="Reset to Step 0"
            style={{ padding: '8px 10px' }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="btn-secondary"
            onClick={stepBackward}
            disabled={currentStepIndex === 0}
            title="Step Backward"
            style={{ padding: '8px 10px', opacity: currentStepIndex === 0 ? 0.5 : 1 }}
          >
            <Rewind size={16} />
          </button>
          <button
            className="btn-primary"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ minWidth: '90px' }}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? 'Pause' : 'Run'}
          </button>
          <button
            className="btn-secondary"
            onClick={stepForward}
            disabled={currentStepIndex >= totalSteps - 1}
            title="Step Forward"
            style={{ padding: '8px 10px', opacity: currentStepIndex >= totalSteps - 1 ? 0.5 : 1 }}
          >
            <FastForward size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
