import React from 'react';
import { Network, Binary, Cpu, Code2, Database, Layers, ArrowRight } from 'lucide-react';
import { useUIStore, type ActiveModule, type CompilerTab } from '../../store/useUIStore';
import { BrandMark } from './BrandMark';

interface ModuleCard {
  id: ActiveModule;
  /** For compiler cards: which compiler tab to open */
  compilerTab?: CompilerTab;
  title: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'AUTOMATA',
    title: 'Finite Automata & Turing Machines',
    tag: 'State machines',
    description:
      'Build DFAs and NFAs on a canvas, convert NFAs to DFAs, minimize them, compare languages, and run a Turing machine on its tape.',
    icon: <Network size={18} />,
  },
  {
    id: 'REGEX',
    title: "Regex & Thompson's Construction",
    tag: 'Regular languages',
    description: 'Turn a regular expression into an ε-NFA with Thompson’s construction and watch it run on an input.',
    icon: <Binary size={18} />,
  },
  {
    id: 'GRAMMAR',
    title: 'Context-Free Grammars & LL(1) Parsing',
    tag: 'Top-down parsing',
    description:
      'FIRST/FOLLOW sets, the LL(1) table with its conflicts, left-recursion removal and left factoring, and a parse tree that grows step by step.',
    icon: <Cpu size={18} />,
  },
  {
    id: 'LR',
    title: 'LR Parsing: LR(0), SLR, LALR, LR(1)',
    tag: 'Bottom-up parsing',
    description:
      'Item-set automata and ACTION/GOTO tables for four methods side by side, and a shift-reduce parse that builds the tree bottom-up.',
    icon: <Layers size={18} />,
  },
  {
    id: 'COMPILER_AST',
    compilerTab: 'AST',
    title: 'Lexical Analysis & Interactive AST',
    tag: 'Compiler front end',
    description: 'Tokens, a syntax tree and three-address code for arithmetic expressions, linked back to the source as you hover.',
    icon: <Code2 size={18} />,
  },
  {
    id: 'COMPILER_AST',
    compilerTab: 'SYMBOL_TABLE',
    title: 'Semantic Analysis & Symbol Table',
    tag: 'Scopes',
    description: 'Step through nested scopes to see declarations, shadowing, and errors for undeclared or redeclared names.',
    icon: <Database size={18} />,
  },
];

export const LandingPage: React.FC = () => {
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const setCompilerTab = useUIStore((state) => state.setCompilerTab);

  const open = (card: ModuleCard) => {
    if (card.compilerTab) setCompilerTab(card.compilerTab);
    setActiveModule(card.id);
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '56px 24px 40px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Intro */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', marginBottom: '48px' }}>
          <BrandMark size={56} />
          <h1 style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            TOC & Compiler Suite
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '620px' }}>
            Interactive visualizations for automata, parsing and compilers. Every algorithm runs step by step, forwards
            and backwards, so you can see exactly how it gets its answer.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <button className="btn-primary" onClick={() => setActiveModule('AUTOMATA')} style={{ padding: '8px 16px' }}>
              Open automata <ArrowRight size={15} />
            </button>
            <button className="btn" onClick={() => setActiveModule('COMPILER_AST')} style={{ padding: '8px 16px' }}>
              Open compiler
            </button>
          </div>
        </section>

        {/* Modules */}
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>Modules</h2>
        <div
          className="landing-module-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px', marginBottom: '40px' }}
        >
          {MODULE_CARDS.map((card) => (
            <button
              key={card.title}
              className="panel landing-card"
              onClick={() => open(card)}
              style={{
                textAlign: 'left',
                padding: '18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                color: 'var(--text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                {card.icon}
                <span style={{ fontSize: '12px' }}>{card.tag}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.35 }}>{card.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>{card.description}</p>
            </button>
          ))}
        </div>

        {/* Reserved for a sponsor/ad slot; renders as nothing until filled */}
        <div id="adsense-slot-landing" />

        <footer
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <span>TOC & Compiler Suite</span>
          <span>Runs entirely in your browser. Save work in the Library or share it as a link.</span>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
