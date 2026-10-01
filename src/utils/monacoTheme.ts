import type { BeforeMount } from '@monaco-editor/react';

export const MONACO_THEME = 'cs-viz-dark';

/**
 * Monaco theme matching the app palette (src/styles/tokens.css). Monaco only accepts hex colors,
 * so the token values are repeated here; keep the two in sync.
 */
export const defineMonacoTheme: BeforeMount = (monaco) => {
  const muted = '#8b919c';
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'e6e8eb' },
      { token: 'keyword', foreground: '7ea6d8' },
      { token: 'number', foreground: 'd1aa64' },
      { token: 'string', foreground: '8fbf7a' },
      { token: 'comment', foreground: '5f6570', fontStyle: 'italic' },
      { token: 'operator', foreground: 'a99bd6' },
      { token: 'delimiter', foreground: '8b919c' },
      { token: 'identifier', foreground: 'e6e8eb' },
    ],
    colors: {
      'editor.background': '#16181d',
      'editor.foreground': '#e6e8eb',
      'editorGutter.background': '#16181d',
      'editorLineNumber.foreground': '#5f6570',
      'editorLineNumber.activeForeground': muted,
      'editor.lineHighlightBackground': '#1c1f25',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#6b9bd1',
      'editor.selectionBackground': '#6b9bd140',
      'editor.inactiveSelectionBackground': '#6b9bd125',
      'editorIndentGuide.background1': '#2a2e36',
      'editorIndentGuide.activeBackground1': '#3a3f49',
      'editorBracketMatch.background': '#23272e',
      'editorBracketMatch.border': '#3a3f49',
      // One quiet color for all bracket depths instead of the default rainbow
      'editorBracketHighlight.foreground1': muted,
      'editorBracketHighlight.foreground2': muted,
      'editorBracketHighlight.foreground3': muted,
      'editorBracketHighlight.foreground4': muted,
      'editorBracketHighlight.foreground5': muted,
      'editorBracketHighlight.foreground6': muted,
      'editorWidget.background': '#1c1f25',
      'editorWidget.border': '#2a2e36',
      'editorOverviewRuler.border': '#00000000',
      'scrollbarSlider.background': '#2a2e3699',
      'scrollbarSlider.hoverBackground': '#3a3f49cc',
      'scrollbarSlider.activeBackground': '#3a3f49',
    },
  });
};
