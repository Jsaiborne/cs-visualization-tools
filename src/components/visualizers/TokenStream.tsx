import React from 'react';
import { Layers, Hash, Code2, AlertTriangle, Brackets } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { TokenType } from '../../types/compiler';

export const TokenStream: React.FC = () => {
  const {
    tokens,
    activeTokenIndex,
    setActiveTokenIndex,
  } = useCompilerStore(
    useShallow((state) => ({
      tokens: state.tokens,
      activeTokenIndex: state.activeTokenIndex,
      setActiveTokenIndex: state.setActiveTokenIndex,
    }))
  );

  // Cards are neutral; only the type label is colored, so kinds stay easy to tell apart
  const getTokenStyle = (type: TokenType) => {
    switch (type) {
      case 'NUMBER':
        return { color: 'var(--cat-4)', icon: <Hash size={13} /> };
      case 'OPERATOR':
        return { color: 'var(--cat-2)', icon: <Code2 size={13} /> };
      case 'PAREN_L':
      case 'PAREN_R':
        return { color: 'var(--text-muted)', icon: <Brackets size={13} /> };
      case 'KEYWORD':
      case 'IDENTIFIER':
        return { color: 'var(--cat-1)', icon: <Layers size={13} /> };
      case 'UNKNOWN':
      default:
        return { color: 'var(--danger)', icon: <AlertTriangle size={13} /> };
    }
  };

  const unknownCount = tokens.filter((t) => t.type === 'UNKNOWN').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
        padding: '16px',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header Metrics Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'var(--accent-subtle)',
              color: 'var(--accent)',
              display: 'flex',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Token Stream
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Interactive Lexer Output Sequence
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unknownCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--warning-subtle)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <AlertTriangle size={12} /> {unknownCount} Unknown
            </span>
          )}
          <span className="badge">
            {tokens.length} Token{tokens.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Token Stream Grid / List Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {tokens.length === 0 ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            Start typing in the code editor to generate tokens...
          </div>
        ) : (
          tokens.map((token, idx) => {
            const style = getTokenStyle(token.type);
            const isSelected = activeTokenIndex === idx;

            return (
              <div
                key={`${idx}-${token.start}-${token.type}-${token.value}`}
                onClick={() => setActiveTokenIndex(isSelected ? null : idx)}
                style={{
                  background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  minWidth: '120px',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {/* Top Row: Type & Index */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: style.color }}>
                    {style.icon}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {token.type}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    #{idx + 1}
                  </span>
                </div>

                {/* Middle Row: Token Value Display */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    padding: '2px 0',
                    wordBreak: 'break-all',
                  }}
                >
                  "{token.value}"
                </div>

                {/* Bottom Row: Positional Offsets [start:end] */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '4px',
                    marginTop: '2px',
                  }}
                >
                  <span>Offset:</span>
                  <span style={{ color: style.color, fontWeight: 600 }}>
                    [{token.start}:{token.end}]
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TokenStream;
