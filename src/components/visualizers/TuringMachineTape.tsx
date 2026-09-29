import React from 'react';
import { ArrowDown, Cpu } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAutomataStore } from '../../store/useAutomataStore';
import type { TMConfig } from '../../types/automata';

export const TuringMachineTape: React.FC = () => {
  const {
    automaton,
    executionSteps,
    currentStepIndex,
  } = useAutomataStore(
    useShallow((state) => ({
      automaton: state.automaton,
      executionSteps: state.executionSteps,
      currentStepIndex: state.currentStepIndex,
    }))
  );
  const tm = automaton.type === 'TM' ? (automaton as TMConfig) : null;
  const blankSymbol = tm?.blankSymbol || 'B';

  const currentStep = executionSteps[currentStepIndex];
  const rawTape = currentStep?.tapeState || [blankSymbol];
  const headIndex = currentStep?.tapeHeadIndex ?? 0;
  const currentStateId = currentStep?.currentStateId || tm?.startStateId || 'q0';
  const status = currentStep?.status || 'PENDING';

  // Pad tape with infinite blank cells on both ends
  const PAD_COUNT = 12;
  const paddedTape = [
    ...Array(PAD_COUNT).fill(blankSymbol),
    ...rawTape,
    ...Array(PAD_COUNT).fill(blankSymbol),
  ];

  const activeIndexInPaddedTape = headIndex + PAD_COUNT;

  // Cell width: 64px, Gap: 8px -> Total Step: 72px
  const CELL_WIDTH = 64;
  const CELL_GAP = 8;
  const STEP_SIZE = CELL_WIDTH + CELL_GAP;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
        background: 'rgba(9, 13, 22, 0.85)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header Info */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--accent-blue)" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            1D Infinite Tape Memory
          </span>
        </div>

        {/* Status Badge & Active Head Position */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background:
                status === 'ACCEPTED'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : status === 'REJECTED'
                  ? 'rgba(244, 63, 94, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)',
              color:
                status === 'ACCEPTED'
                  ? '#34d399'
                  : status === 'REJECTED'
                  ? '#f43f5e'
                  : '#38bdf8',
              border: `1px solid ${
                status === 'ACCEPTED'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : status === 'REJECTED'
                  ? 'rgba(244, 63, 94, 0.3)'
                  : 'rgba(56, 189, 248, 0.3)'
              }`,
            }}
          >
            Head Pos: {headIndex} | Status: {status}
          </div>
        </div>
      </div>

      {/* Read/Write Head Fixed Indicator at Center */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'var(--gradient-primary)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>HEAD</span>
          <span style={{ opacity: 0.8 }}>({currentStateId})</span>
        </div>
        <ArrowDown size={22} color="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }} />
      </div>

      {/* Tape Viewport Container */}
      <div
        style={{
          width: '100%',
          height: '90px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Left & Right Fading Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '80px',
            background: 'linear-gradient(to right, rgba(9, 13, 22, 0.95), transparent)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '80px',
            background: 'linear-gradient(to left, rgba(9, 13, 22, 0.95), transparent)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />

        {/* Translating Track of Tape Cells */}
        <div
          style={{
            display: 'flex',
            gap: `${CELL_GAP}px`,
            position: 'absolute',
            top: '8px',
            // Anchor the strip's left edge at the window's center, then pull the head cell's center
            // onto it. (A % inside translateX is relative to the strip's own width, not the window.)
            left: '50%',
            transform: `translateX(-${activeIndexInPaddedTape * STEP_SIZE + CELL_WIDTH / 2}px)`,
            transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {paddedTape.map((symbol, idx) => {
            const isHead = idx === activeIndexInPaddedTape;
            const tapePos = idx - PAD_COUNT;

            return (
              <div
                key={idx}
                style={{
                  width: `${CELL_WIDTH}px`,
                  height: '64px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isHead
                    ? 'rgba(56, 189, 248, 0.18)'
                    : symbol === blankSymbol
                    ? 'rgba(15, 23, 42, 0.4)'
                    : 'rgba(30, 41, 59, 0.8)',
                  border: isHead
                    ? '2px solid #38bdf8'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isHead
                    ? '0 0 16px rgba(56, 189, 248, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.2)'
                    : 'none',
                  transition: 'all 200ms ease',
                  userSelect: 'none',
                }}
              >
                {/* Monospace Symbol */}
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: isHead
                      ? '#ffffff'
                      : symbol === blankSymbol
                      ? 'var(--text-muted)'
                      : 'var(--text-primary)',
                  }}
                >
                  {symbol}
                </span>

                {/* Index Offset Badge */}
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: isHead ? '#38bdf8' : 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {tapePos}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TuringMachineTape;
