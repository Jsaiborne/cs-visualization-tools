import React from 'react';
import { Cpu, AlertTriangle, Code2, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { TACInstruction } from '../../types/compiler';

export const TACViewer: React.FC = () => {
  const {
    tacInstructions,
    parseError,
    selectedRange,
    setSelectedRange,
  } = useCompilerStore(
    useShallow((state) => ({
      tacInstructions: state.tacInstructions,
      parseError: state.parseError,
      selectedRange: state.selectedRange,
      setSelectedRange: state.setSelectedRange,
    }))
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--surface-2)',
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
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Three-Address Code (TAC / IR)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-subtle)',
              color: 'var(--success)',
              border: '1px solid var(--success-border)',
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
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-subtle)',
              border: '1px solid var(--warning-border)',
              color: 'var(--warning)',
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
                      borderRadius: 'var(--radius-md)',
                      background: isHovered ? 'var(--surface-2)' : 'var(--surface)',
                      border: `1px solid ${isHovered ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'background 120ms ease, border-color 120ms ease',
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
                          color: isHovered ? 'var(--accent)' : 'var(--text-muted)',
                          width: '24px',
                        }}
                      >
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>

                      {/* Monospaced TAC Statement */}
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'var(--text)',
                        }}
                      >
                        {/* Target Temp Variable */}
                        <span
                          style={{
                            color: 'var(--cat-2)',
                            fontWeight: 700,
                          }}
                        >
                          {instr.result}
                        </span>

                        <span style={{ color: 'var(--text-muted)' }}>=</span>

                        {/* Operand 1 (binary form: arg1 op arg2) */}
                        {instr.arg2 !== null && <span style={{ color: 'var(--accent)' }}>{instr.arg1}</span>}

                        {/* Operator */}
                        <span
                          style={{
                            color: 'var(--danger)',
                            fontWeight: 700,
                            padding: '0 2px',
                          }}
                        >
                          {instr.op}
                        </span>

                        {/* Operand 2, or the sole operand of a unary op */}
                        <span style={{ color: 'var(--accent)' }}>{instr.arg2 ?? instr.arg1}</span>
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
                            color: isHovered ? 'var(--accent)' : 'var(--text-muted)',
                            background: isHovered
                              ? 'var(--accent-subtle)'
                              : 'var(--surface-3)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
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
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              <strong style={{ color: 'var(--text-muted)' }}>💡 IR Generation Note:</strong>{' '}
              Three-Address Code (TAC) linearizes hierarchical AST expressions into quad-operand instructions of form{' '}
              <code style={{ color: 'var(--cat-2)' }}>result = arg1 op arg2</code>. Hover any line to highlight its corresponding sub-expression in the source editor.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TACViewer;
