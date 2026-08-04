import React from 'react';
import { Play, Sparkles, Layers, Sliders } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAutomataStore } from '../../store/useAutomataStore';

export const Sidebar: React.FC = () => {
  const { activeModule } = useUIStore();
  const { automaton, testInput, setTestInput } = useAutomataStore();

  return (
    <aside className="glass-sidebar" style={{ width: '320px', height: 'calc(100vh - 60px)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      {/* Module Title Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeModule} Config
          </h2>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
          {automaton.type}
        </span>
      </div>

      {/* Preset Selector */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Automaton Name
        </label>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {automaton.name}
        </div>
      </div>

      {/* Input String Testing Panel */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label htmlFor="test-input-field" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Test Input String
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="test-input-field"
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. 10010"
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button className="btn-primary" style={{ padding: '8px 12px' }} title="Run Simulation">
            <Play size={14} />
          </button>
        </div>
      </div>

      {/* Alphabet & States Information */}
      <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Definition Details</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Alphabet Σ</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{`{ ${automaton.alphabet.join(', ')} }`}</span>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>States Q</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{automaton.states.length} states</span>
          </div>
        </div>
      </div>

      {/* Presets / Quick Actions */}
      <div className="glass-panel" style={{ padding: '14px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={14} color="var(--accent-pink)" />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Visualization Hint</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          Drag states on the canvas to reposition nodes. Click transitions to inspect transition rules.
        </p>
      </div>
    </aside>
  );
};
