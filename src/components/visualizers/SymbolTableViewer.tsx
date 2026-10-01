import React, { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { MONACO_THEME, defineMonacoTheme } from '../../utils/monacoTheme';
import {
  Code2,
  Sparkles,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  AlertTriangle,
  Database,
  ArrowUp,
  ShieldAlert,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useScopeStore, SCOPE_PRESETS } from '../../store/useScopeStore';

type CodeEditor = Parameters<OnMount>[0];
type MonacoApi = Parameters<OnMount>[1];
type DecorationsCollection = ReturnType<CodeEditor['createDecorationsCollection']>;

export const SymbolTableViewer: React.FC = () => {
  const {
    sourceCode,
    setSourceCode,
    scopeSteps,
    currentStepIndex,
    isPlaying,
    setIsPlaying,
    stepForward,
    stepBackward,
    reset,
    parseError,
    loadPreset,
  } = useScopeStore(
    useShallow((state) => ({
      sourceCode: state.sourceCode,
      setSourceCode: state.setSourceCode,
      scopeSteps: state.scopeSteps,
      currentStepIndex: state.currentStepIndex,
      isPlaying: state.isPlaying,
      setIsPlaying: state.setIsPlaying,
      stepForward: state.stepForward,
      stepBackward: state.stepBackward,
      reset: state.reset,
      parseError: state.parseError,
      loadPreset: state.loadPreset,
    }))
  );

  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<MonacoApi | null>(null);
  const decorationsRef = useRef<DecorationsCollection | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();
  };

  const currentStep = scopeSteps[currentStepIndex];
  const activeScopeStack = currentStep ? currentStep.activeScopeStack : [];
  const activeScopeId = currentStep ? currentStep.activeScopeId : null;

  // Auto-scroll Monaco Editor to active line and highlight it
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !decorationsRef.current || !currentStep) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const line = Math.min(Math.max(1, currentStep.currentLine), model.getLineCount());

    try {
      editor.revealLineInCenterIfOutsideViewport(line);

      const maxColumn = model.getLineMaxColumn(line);

      decorationsRef.current.set([
        {
          range: new monaco.Range(line, 1, line, maxColumn),
          options: {
            isWholeLine: true,
            className: 'monaco-scope-line-highlight',
          },
        },
      ]);
    } catch {
      decorationsRef.current.clear();
    }
  }, [currentStep]);

  // Re-order stack so top of stack is rendered on TOP visually, and Global Scope is at the BOTTOM
  const displayStack = [...activeScopeStack].reverse();

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
          width: '45%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        {/* Editor Toolbar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Scoped Mini-Language Code
            </span>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Presets:</span>
            {SCOPE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
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
                {preset.name.split(' ')[0]}
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
            onChange={(val) => setSourceCode(val ?? '')}
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

        {/* Error / Status Bar */}
        {parseError ? (
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--danger-subtle)',
              borderTop: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={15} />
            <span>{parseError}</span>
          </div>
        ) : (
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
            <span>Active Line: {currentStep?.currentLine || 1}</span>
            <span>Total Steps: {scopeSteps.length}</span>
          </div>
        )}
      </div>

      {/* Right Pane: Symbol Table Stack Visualizer */}
      <div
        style={{
          width: '55%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
      >
        {/* Visualizer Header Controls Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Symbol Table Scope Stack
            </span>
          </div>

          {/* Time-Travel Playback Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-subtle)',
              }}
            >
              Step {currentStepIndex + 1} / {scopeSteps.length || 1}
            </span>

            <button
              className="btn-secondary"
              onClick={reset}
              disabled={scopeSteps.length === 0}
              style={{ padding: '4px 8px', opacity: scopeSteps.length === 0 ? 0.5 : 1 }}
              title="Reset to Step 0"
            >
              <RotateCcw size={14} />
            </button>
            <button
              className="btn-secondary"
              onClick={stepBackward}
              disabled={currentStepIndex === 0}
              style={{ padding: '4px 8px', opacity: currentStepIndex === 0 ? 0.5 : 1 }}
              title="Step Backward"
            >
              <Rewind size={14} />
            </button>
            <button
              className="btn-primary"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={scopeSteps.length === 0}
              style={{ padding: '4px 12px', fontSize: '12px', opacity: scopeSteps.length === 0 ? 0.5 : 1 }}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'Pause' : 'Run'}
            </button>
            <button
              className="btn-secondary"
              onClick={stepForward}
              disabled={currentStepIndex >= scopeSteps.length - 1}
              style={{ padding: '4px 8px', opacity: currentStepIndex >= scopeSteps.length - 1 ? 0.5 : 1 }}
              title="Step Forward"
            >
              <FastForward size={14} />
            </button>
          </div>
        </div>

        {/* Action Snapshot Banner */}
        {currentStep && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${currentStep.isError ? 'badge-danger' : 'badge-accent'}`}>{currentStep.action}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Line {currentStep.currentLine}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {currentStep.description}
            </p>
          </div>
        )}

        {/* Scope Cards Stack Container */}
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
          {displayStack.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No active scopes found. Add valid scope code to run analysis.
            </div>
          ) : (
            displayStack.map((scope) => {
              const isTopActive = scope.id === activeScopeId;
              const isGlobal = scope.parentId === null;
              const variablesList = Object.values(scope.variables);

              return (
                <div
                  key={scope.id}
                  className="panel"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    border: `1px solid ${isTopActive ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'border-color 200ms ease',
                    position: 'relative',
                  }}
                >
                  {/* Scope Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={15} color={isTopActive ? 'var(--accent)' : 'var(--text-muted)'} />
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {scope.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--surface-3)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        ID: {scope.id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isTopActive && (
                        <span className="badge badge-accent">
                          <ArrowUp size={11} /> Active scope
                        </span>
                      )}
                      {isGlobal && (
                        <span className="badge">Global</span>
                      )}
                    </div>
                  </div>

                  {/* Variables Dictionary Table */}
                  {variablesList.length === 0 ? (
                    <div
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      No variables declared in this scope yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              textAlign: 'left',
                              color: 'var(--text-muted)',
                              borderBottom: '1px solid var(--border)',
                              fontSize: '11px',
                            }}
                          >
                            <th style={{ padding: '6px 8px' }}>VARIABLE</th>
                            <th style={{ padding: '6px 8px' }}>TYPE</th>
                            <th style={{ padding: '6px 8px' }}>VALUE</th>
                            <th style={{ padding: '6px 8px' }}>DECL LINE</th>
                            <th style={{ padding: '6px 8px' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variablesList.map((v) => {
                            const isTarget = currentStep?.targetVariable === v.name && isTopActive;
                            return (
                              <tr
                                key={v.name}
                                style={{
                                  background: isTarget ? 'var(--accent-subtle)' : 'transparent',
                                  transition: 'background 200ms ease',
                                  borderBottom: '1px solid var(--border)',
                                }}
                              >
                                <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--accent)' }}>
                                  {v.name}
                                </td>
                                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                                  {v.type}
                                </td>
                                <td
                                  style={{
                                    padding: '6px 8px',
                                    fontWeight: 700,
                                    color: isTarget ? 'var(--success)' : 'var(--text)',
                                  }}
                                >
                                  {v.value}
                                </td>
                                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                                  Line {v.declaredLine}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  {v.isShadowing ? (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        padding: '1px 6px',
                                        borderRadius: '3px',
                                        background: 'var(--warning-subtle)',
                                        border: '1px solid var(--warning-border)',
                                        color: 'var(--warning)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                      }}
                                    >
                                      <ShieldAlert size={10} /> Shadowing
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      Alive
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolTableViewer;
