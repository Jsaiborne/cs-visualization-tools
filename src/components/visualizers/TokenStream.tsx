import React from 'react';
import { Layers, Hash, Code2, AlertTriangle, Brackets } from 'lucide-react';
import { useCompilerStore } from '../../store/useCompilerStore';
import type { TokenType } from '../../types/compiler';

export const TokenStream: React.FC = () => {
  const { tokens, activeTokenIndex, setActiveTokenIndex } = useCompilerStore();

  const getTokenStyle = (type: TokenType) => {
    switch (type) {
      case 'NUMBER':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.35)',
          color: 'var(--accent-blue)',
          glow: '0 0 12px rgba(56, 189, 248, 0.25)',
          icon: <Hash size={13} />,
        };
      case 'OPERATOR':
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.35)',
          color: 'var(--accent-purple)',
          glow: '0 0 12px rgba(168, 85, 247, 0.25)',
          icon: <Code2 size={13} />,
        };
      case 'PAREN_L':
      case 'PAREN_R':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: 'var(--accent-emerald)',
          glow: '0 0 12px rgba(16, 185, 129, 0.25)',
          icon: <Brackets size={13} />,
        };
      case 'KEYWORD':
      case 'IDENTIFIER':
        return {
          bg: 'rgba(99, 102, 241, 0.12)',
          border: 'rgba(99, 102, 241, 0.35)',
          color: '#818cf8',
          glow: '0 0 12px rgba(99, 102, 241, 0.25)',
          icon: <Layers size={13} />,
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.45)',
          color: 'var(--accent-amber)',
          glow: '0 0 12px rgba(245, 158, 11, 0.3)',
          icon: <AlertTriangle size={13} />,
        };
    }
  };

  const unknownCount = tokens.filter((t) => t.type === 'UNKNOWN').length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '20px',
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
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-blue)',
              display: 'flex',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Token Stream
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <AlertTriangle size={12} /> {unknownCount} Unknown
            </span>
          )}
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-blue)',
            }}
          >
            {tokens.length} Token{tokens.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)' }}>
          NUMBER
        </span>
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
          OPERATOR
        </span>
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
          PAREN_L / PAREN_R
        </span>
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
          UNKNOWN
        </span>
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
                  background: isSelected ? style.bg.replace('0.12', '0.25') : style.bg,
                  border: isSelected ? `2px solid ${style.color}` : `1px solid ${style.border}`,
                  boxShadow: isSelected ? style.glow : 'var(--shadow-glass)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  minWidth: '120px',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'var(--glass-backdrop)',
                  WebkitBackdropFilter: 'var(--glass-backdrop)',
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
                    color: '#ffffff',
                    padding: '2px 0',
                    textShadow: `0 0 10px ${style.color}`,
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
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
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
