import { create } from 'zustand';
import { produce } from 'immer';
import { parseScopeLanguage, type ProgramScopeNode } from '../core/compiler/scopeParser';
import { analyzeScopes, type ScopeExecutionStep } from '../core/compiler/semanticAnalyzer';
import { createPlaybackSlice, type PlaybackState } from './playback';

export interface ScopePreset {
  id: string;
  name: string;
  code: string;
}

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'nested_shadowing',
    name: 'Nested Scopes & Shadowing',
    code: `let x = 1;
{
  let x = 2;
  let y = 3;
}
x = 4;`,
  },
  {
    id: 'multi_level',
    name: 'Multi-Level Scope & Assignment',
    code: `let a = 10;
let b = 20;
{
  let b = 30;
  {
    let c = 40;
    a = 50;
  }
}`,
  },
  {
    id: 'sequential_blocks',
    name: 'Sequential Independent Blocks',
    code: `let count = 0;
{
  let temp = 100;
  count = temp;
}
{
  let temp = 200;
  count = temp;
}`,
  },
];

interface ScopeState extends PlaybackState {
  sourceCode: string;
  ast: ProgramScopeNode | null;
  scopeSteps: ScopeExecutionStep[];
  parseError: string | null;

  setSourceCode: (code: string) => void;
  loadPreset: (presetId: string) => void;
}

const defaultPreset = SCOPE_PRESETS[0];

function computeScopeState(sourceCode: string) {
  try {
    const ast = parseScopeLanguage(sourceCode);
    const scopeSteps = analyzeScopes(ast);
    return {
      sourceCode,
      ast,
      scopeSteps,
      currentStepIndex: 0,
      parseError: null,
    };
  } catch (err: any) {
    return {
      sourceCode,
      ast: null,
      scopeSteps: [],
      currentStepIndex: 0,
      parseError: err.message || 'Syntax error in scope code',
    };
  }
}

const initialComputed = computeScopeState(defaultPreset.code);

export const useScopeStore = create<ScopeState>((set) => ({
  ...createPlaybackSlice<ScopeState>(set, (state) => state.scopeSteps.length),
  ...initialComputed,

  setSourceCode: (code: string) => {
    set(
      produce((draft: ScopeState) => {
        const computed = computeScopeState(code);
        draft.sourceCode = computed.sourceCode;
        draft.ast = computed.ast;
        draft.scopeSteps = computed.scopeSteps;
        draft.currentStepIndex = 0;
        draft.parseError = computed.parseError;
        draft.isPlaying = false;
      })
    );
  },

  loadPreset: (presetId: string) => {
    const preset = SCOPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    set(
      produce((draft: ScopeState) => {
        const computed = computeScopeState(preset.code);
        draft.sourceCode = computed.sourceCode;
        draft.ast = computed.ast;
        draft.scopeSteps = computed.scopeSteps;
        draft.currentStepIndex = 0;
        draft.parseError = computed.parseError;
        draft.isPlaying = false;
      })
    );
  },
}));
