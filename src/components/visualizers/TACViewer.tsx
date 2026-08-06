import React from 'react';
import { Cpu, AlertTriangle, Code2, ArrowRight } from 'lucide-react';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { TACInstruction } from '../../types/compiler';

export const TACViewer: React.FC = () => {
  const { tacInstructions, parseError, selectedRange, setSelectedRange } = useCompilerStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Info Bar */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Three-Address Code (TAC / IR)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            {tacInstructions.length} {tacInstructions.length === 1 ? 'Instruction' : 'Instructions'}
          </span>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Parse Error Display */}
        {parseError ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-amber)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
              <AlertTriangle size={18} /> Syntax Error Detected
            </div>
            <p style={{ fontSize: '12px', margin: 0, fontFamily: 'var(--font-mono)' }}>
              {parseError}
            </p>
          </div>
        ) : tacInstructions.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              gap: '8px',
              textAlign: 'center',
              padding: '32px',
            }}
          >
            <Code2 size={32} opacity={0.4} color="var(--text-muted)" />
            <span>No TAC instructions generated.</span>
            <span style={{ fontSize: '11px' }}>
              Type a valid mathematical expression to view its three-address code.
            </span>
          </div>
        ) : (
          <>
            {/* Linear Instruction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tacInstructions.map((instr: TACInstruction, idx: number) => {
                const isHovered =
                  selectedRange &&
                  instr.originalRange &&
                  selectedRange.start === instr.originalRange.start &&
                  selectedRange.end === instr.originalRange.end;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => {
                      if (instr.originalRange) {
                        setSelectedRange({
                          start: instr.originalRange.start,
                          end: instr.originalRange.end,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setSelectedRange(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isHovered
                        ? 'rgba(56, 189, 248, 0.12)'
                        : 'rgba(15, 23, 42, 0.65)',
                      border: isHovered
                        ? '1px solid #38bdf8'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isHovered
                        ? '0 0 14px rgba(56, 189, 248, 0.25)'
                        : '0 2px 6px rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      transform: isHovered ? 'translateX(4px)' : 'none',
                    }}
                  >
                    {/* Left: Instruction Line Number and Statement */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Step Number Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isHovered ? '#38bdf8' : 'var(--text-muted)',
                          width: '24px',
                        }}
                      >
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>

                      {/* Monospaced TAC Statement */}
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#f8fafc',
                        }}
                      >
                        {/* Target Temp Variable */}
                        <span
                          style={{
                            color: '#c084fc',
                            fontWeight: 700,
                          }}
                        >
                          {instr.result}
                        </span>

                        <span style={{ color: 'var(--text-muted)' }}>=</span>

                        {/* Operand 1 */}
                        <span style={{ color: '#38bdf8' }}>{instr.arg1}</span>

                        {/* Operator */}
                        <span
                          style={{
                            color: '#f43f5e',
                            fontWeight: 700,
                            padding: '0 2px',
                          }}
                        >
                          {instr.op}
                        </span>

                        {/* Operand 2 */}
                        <span style={{ color: '#38bdf8' }}>{instr.arg2}</span>
                      </div>
                    </div>

                    {/* Right: Mapping Range Badge */}
                    {instr.originalRange && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowRight size={12} color="var(--text-muted)" opacity={0.6} />
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: isHovered ? '#38bdf8' : 'var(--text-muted)',
                            background: isHovered
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(30, 41, 59, 0.5)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          [{instr.originalRange.start}:{instr.originalRange.end}]
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* IR Information Box */}
            <div
              style={{
                marginTop: 'auto',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.3)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              <strong style={{ color: 'var(--text-secondary)' }}>💡 IR Generation Note:</strong>{' '}
              Three-Address Code (TAC) linearizes hierarchical AST expressions into quad-operand instructions of form{' '}
              <code style={{ color: '#c084fc' }}>result = arg1 op arg2</code>. Hover any line to highlight its corresponding sub-expression in the source editor.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TACViewer;
