import React from 'react';
import {
  Network,
  Binary,
  Cpu,
  Code2,
  Database,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Share2,
} from 'lucide-react';
import { useUIStore, type ActiveModule } from '../../store/useUIStore';

export const LandingPage: React.FC = () => {
  const setActiveModule = useUIStore((state) => state.setActiveModule);

  const moduleCards: {
    id: ActiveModule;
    title: string;
    tag: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
  }[] = [
    {
      id: 'AUTOMATA',
      title: 'Finite Automata & Turing Machines',
      tag: 'State Machines & Tape Memory',
      description:
        'Interactive drag-and-drop DFA/NFA state graph builder, real-time determinism validator, and 1D bi-infinite tape Turing Machine simulator with step execution snapshots.',
      icon: <Network size={28} />,
      color: 'var(--accent-blue)',
      bgGradient: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 70%)',
    },
    {
      id: 'REGEX',
      title: "Regex & Thompson's Construction",
      tag: 'Regular Languages',
      description:
        'Regex infix-to-postfix Shunting-Yard parser, explicit concatenation operator insertion, Thompson NFA state graph auto-layout, and multi-state active set highlights.',
      icon: <Binary size={28} />,
      color: 'var(--accent-purple)',
      bgGradient: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent 70%)',
    },
    {
      id: 'GRAMMAR',
      title: 'Context-Free Grammars & LL(1) Parsing',
      tag: 'Syntax Analysis',
      description:
        'Text-based CFG rule editor, automatic FIRST/FOLLOW fixpoint set solver, 2D LL(1) parse table generator with conflict detection, and animated Pushdown Stack simulator.',
      icon: <Cpu size={28} />,
      color: 'var(--accent-pink)',
      bgGradient: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.15), transparent 70%)',
    },
    {
      id: 'COMPILER_AST',
      title: 'Lexical Analysis & Interactive AST',
      tag: 'Compiler Front-End',
      description:
        'Character-offset token stream scanner, recursive descent parser, and interactive D3.js AST tree diagram with Monaco Code Editor cross-component line decorations.',
      icon: <Code2 size={28} />,
      color: 'var(--accent-emerald)',
      bgGradient: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 70%)',
    },
    {
      id: 'COMPILER_AST',
      title: 'Semantic Analysis & Symbol Table',
      tag: 'Scope & IR Generation',
      description:
        'Vertical stack visualizer for lexical scope dictionaries, variable declaration & shadowing inspector, and Three-Address Code (TAC) intermediate representation generator.',
      icon: <Database size={28} />,
      color: 'var(--accent-amber)',
      bgGradient: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.15), transparent 70%)',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-dark)',
        padding: '36px 24px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        {/* Top Announcement Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--accent-blue)',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'var(--glass-backdrop)',
            }}
          >
            <Sparkles size={14} />
            <span>Theory of Computation & Compiler Visualization Platform</span>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            className="gradient-text"
            style={{
              fontSize: '42px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              maxWidth: '850px',
              marginInline: 'auto',
            }}
          >
            Explore Automata, Parsing Algorithms & Compilers Interactively
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              marginInline: 'auto',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            A high-performance visual laboratory for computer science students and engineers. Build DFAs/NFAs, simulate Turing Machines, parse CFG grammars, inspect ASTs, and analyze symbol tables with 100% time-travel execution.
          </p>

          {/* Quick Action Hero Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => setActiveModule('AUTOMATA')}
              style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '8px' }}
            >
              Launch Automata Studio <ArrowRight size={16} />
            </button>

            <button
              className="btn-secondary"
              onClick={() => setActiveModule('COMPILER_AST')}
              style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '8px' }}
            >
              <Code2 size={16} /> Open Compiler Visualizer
            </button>
          </div>
        </div>

        {/* Suite Feature Badges Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '44px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '10px',
            }}
          >
            <Zap size={20} color="var(--accent-blue)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Time-Travel Engine
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step forward & backward through steps
              </div>
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '10px',
            }}
          >
            <Share2 size={20} color="var(--accent-purple)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Deep Link Sharing
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Base64 URL serialized machine state
              </div>
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '10px',
            }}
          >
            <ShieldCheck size={20} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Real-Time Validation
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                DFA determinism & LL(1) table checks
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Visualization Modules & Tools
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Select any module to open its dedicated interactive workspace.
          </p>
        </div>

        {/* Cards Grid */}
        <div
          className="landing-module-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          {moduleCards.map((card, idx) => (
            <div
              key={idx}
              className="glass-panel"
              onClick={() => setActiveModule(card.id)}
              style={{
                padding: '24px',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: card.bgGradient,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${card.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
              }}
            >
              <div>
                {/* Header Tag & Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: `1px solid ${card.color}44`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                      boxShadow: `0 0 12px ${card.color}22`,
                    }}
                  >
                    {card.icon}
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      color: card.color,
                    }}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  {card.title}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                  }}
                >
                  {card.description}
                </p>
              </div>

              {/* Card Footer Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: card.color,
                }}
              >
                <span>Launch Tool</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Dedicated AdSense Slot */}
        <div
          id="adsense-slot-landing"
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '40px',
          }}
        >
          Google AdSense Sponsor Slot (`#adsense-slot-landing`)
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <div>Theory of Computation & Compiler Visualizer Suite v1.0</div>
          <div>Built with React, TypeScript, D3.js, React Flow, Zustand & Monaco Editor</div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
