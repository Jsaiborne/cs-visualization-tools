import React, { useState, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Code2, Sparkles, Layers, Network, Cpu } from 'lucide-react';
import { useCompilerStore } from '../../store/useCompilerStore';
import { TokenStream } from './TokenStream';
import { ASTViewer } from './ASTViewer';
import { TACViewer } from './TACViewer';

export const CompilerEditor: React.FC = () => {
  const { sourceCode, setSourceCode, selectedRange } = useCompilerStore();
  const [rightPaneTab, setRightPaneTab] = useState<'TOKENS' | 'AST' | 'TAC'>('AST');

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const presets = [
    { label: 'Basic Math', code: '(5 + 32) * 4' },
    { label: 'Nested Parens', code: '2 * (7 + 3)' },
    { label: 'Decimals & Ops', code: '3.1415 * 2.5 + 42' },
    { label: 'Identifiers & Funcs', code: 'sin(x) + cos(y) * 100' },
  ];

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  // Cross-component Monaco Editor decoration highlighting for hovered AST nodes & TAC instructions
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (!selectedRange || selectedRange.start >= selectedRange.end) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
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

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: range,
          options: {
            isWholeLine: false,
            inlineClassName: 'monaco-ast-inline-highlight',
          },
        },
      ]);
    } catch {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [selectedRange]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'var(--bg-dark)',
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
          borderRight: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 22, 0.95)',
        }}
      >
        {/* Editor Toolbar Header */}
        <div
          style={{
            height: '48px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Source Code Input
            </span>
          </div>

          {/* Quick Preset Expressions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--accent-purple)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Presets:</span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSourceCode(preset.code)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(30, 41, 59, 0.5)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
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
            theme="vs-dark"
            value={sourceCode}
            onMount={handleEditorDidMount}
            onChange={(value) => setSourceCode(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
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
            background: 'rgba(15, 23, 42, 0.9)',
            borderTop: '1px solid var(--border-subtle)',
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
          background: 'rgba(9, 13, 22, 0.95)',
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
            background: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '3px',
              borderRadius: '6px',
            }}
          >
            <button
              onClick={() => setRightPaneTab('AST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: rightPaneTab === 'AST' ? 600 : 400,
                background: rightPaneTab === 'AST' ? 'var(--accent-purple)' : 'transparent',
                color: rightPaneTab === 'AST' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Network size={14} /> AST Tree
            </button>
            <button
              onClick={() => setRightPaneTab('TAC')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: rightPaneTab === 'TAC' ? 600 : 400,
                background: rightPaneTab === 'TAC' ? 'var(--accent-emerald)' : 'transparent',
                color: rightPaneTab === 'TAC' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Cpu size={14} /> TAC Code
            </button>
            <button
              onClick={() => setRightPaneTab('TOKENS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '12px',
                fontWeight: rightPaneTab === 'TOKENS' ? 600 : 400,
                background: rightPaneTab === 'TOKENS' ? 'var(--accent-blue)' : 'transparent',
                color: rightPaneTab === 'TOKENS' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Layers size={14} /> Token Stream
            </button>
          </div>
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
