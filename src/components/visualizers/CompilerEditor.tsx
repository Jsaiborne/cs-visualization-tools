import React, { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { MONACO_THEME, defineMonacoTheme } from '../../utils/monacoTheme';
import { Code2, Sparkles, Layers, Network, Cpu, Database } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCompilerStore } from '../../store/useCompilerStore';
import { useUIStore, type CompilerTab } from '../../store/useUIStore';
import { TokenStream } from './TokenStream';
import { ASTViewer } from './ASTViewer';
import { TACViewer } from './TACViewer';
import SymbolTableViewer from './SymbolTableViewer';

type CodeEditor = Parameters<OnMount>[0];
type MonacoApi = Parameters<OnMount>[1];
type DecorationsCollection = ReturnType<CodeEditor['createDecorationsCollection']>;

const COMPILER_TABS: { id: CompilerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'AST', label: 'AST Tree', icon: <Network size={14} /> },
  { id: 'TAC', label: 'TAC Code', icon: <Cpu size={14} /> },
  { id: 'TOKENS', label: 'Token Stream', icon: <Layers size={14} /> },
  { id: 'SYMBOL_TABLE', label: 'Symbol Table', icon: <Database size={14} /> },
];

const CompilerTabs: React.FC<{ current: CompilerTab; onSelect: (tab: CompilerTab) => void }> = ({ current, onSelect }) => (
  <div className="tabs" role="tablist" aria-label="Compiler views">
    {COMPILER_TABS.map((t) => (
      <button key={t.id} role="tab" className="tab" aria-selected={current === t.id} onClick={() => onSelect(t.id)}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

export const CompilerEditor: React.FC = () => {
  const { sourceCode, setSourceCode, selectedRange } = useCompilerStore(
    useShallow((state) => ({
      sourceCode: state.sourceCode,
      setSourceCode: state.setSourceCode,
      selectedRange: state.selectedRange,
    }))
  );
  const rightPaneTab = useUIStore((state) => state.compilerTab);
  const setRightPaneTab = useUIStore((state) => state.setCompilerTab);

  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<MonacoApi | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);

  const presets = [
    { label: 'Basic Math', code: '(5 + 32) * 4' },
    { label: 'Nested Parens', code: '2 * (7 + 3)' },
    { label: 'Decimals & Ops', code: '3.1415 * 2.5 + 42' },
    { label: 'Identifiers & Funcs', code: 'sin(x) + cos(y) * 100' },
  ];

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();
  };

  // Cross-component Monaco Editor decoration highlighting for hovered AST nodes & TAC instructions
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !decorationsRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = decorationsRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (!selectedRange || selectedRange.start >= selectedRange.end) {
      decorations.clear();
      return;
    }

    try {
      const startPos = model.getPositionAt(selectedRange.start);
      const endPos = model.getPositionAt(selectedRange.end);

      const range = new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      );

      decorations.set([
        {
          range: range,
          options: {
            isWholeLine: false,
            inlineClassName: 'monaco-ast-inline-highlight',
          },
        },
      ]);
    } catch {
      decorations.clear();
    }
  }, [selectedRange]);

  if (rightPaneTab === 'SYMBOL_TABLE') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: '42px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <CompilerTabs current={rightPaneTab} onSelect={setRightPaneTab} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SymbolTableViewer />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Left Pane: Monaco Code Editor */}
      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        {/* Editor Toolbar Header */}
        <div
          style={{
            height: '42px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Source Code Input
            </span>
          </div>

          {/* Quick Preset Expressions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Presets:</span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSourceCode(preset.code)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-3)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme={MONACO_THEME}
            beforeMount={defineMonacoTheme}
            value={sourceCode}
            onMount={handleEditorDidMount}
            onChange={(value) => setSourceCode(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Status footer */}
        <div
          style={{
            height: '28px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>Length: {sourceCode.length} chars</span>
          <span>
            Highlight Offset: {selectedRange ? `[${selectedRange.start}:${selectedRange.end}]` : 'None'}
          </span>
        </div>
      </div>

      {/* Right Pane Container with Switchable Visualizer Tabs */}
      <div
        style={{
          width: '50%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
        }}
      >
        {/* Right Pane Tab Navigation Bar */}
        <div
          style={{
            height: '48px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <CompilerTabs current={rightPaneTab} onSelect={setRightPaneTab} />
        </div>

        {/* Tab View Viewport */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {rightPaneTab === 'AST' ? (
            <ASTViewer />
          ) : rightPaneTab === 'TAC' ? (
            <TACViewer />
          ) : (
            <TokenStream />
          )}
        </div>
      </div>
    </div>
  );
};

export default CompilerEditor;
