import React from 'react';
import { ArrowDown } from 'lucide-react';
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
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Info */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Tape</span>

        {/* Status Badge & Active Head Position */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className={`badge ${status === 'ACCEPTED' ? 'badge-success' : status === 'REJECTED' ? 'badge-danger' : ''}`}
            style={{ fontFamily: 'var(--font-mono)' }}
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
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>HEAD</span>
          <span style={{ opacity: 0.8 }}>({currentStateId})</span>
        </div>
        <ArrowDown size={18} color="var(--accent)" />
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
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isHead ? 'var(--accent-subtle)' : symbol === blankSymbol ? 'var(--bg)' : 'var(--surface-2)',
                  border: isHead ? '2px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'all 200ms ease',
                  userSelect: 'none',
                }}
              >
                {/* Monospace Symbol */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: symbol === blankSymbol && !isHead ? 'var(--text-faint)' : 'var(--text)',
                  }}
                >
                  {symbol}
                </span>

                {/* Index Offset Badge */}
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: isHead ? 'var(--accent)' : 'var(--text-muted)',
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
