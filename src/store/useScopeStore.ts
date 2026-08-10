import { create } from 'zustand';
import { produce } from 'immer';
import { parseScopeLanguage, type ProgramScopeNode } from '../core/compiler/scopeParser';
import { analyzeScopes, type ScopeExecutionStep } from '../core/compiler/semanticAnalyzer';

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

interface ScopeState {
  sourceCode: string;
  ast: ProgramScopeNode | null;
  scopeSteps: ScopeExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  parseError: string | null;

  setSourceCode: (code: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  setCurrentStepIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeedMs: (speed: number) => void;
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
  ...initialComputed,
  isPlaying: false,
  playbackSpeedMs: 800,

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

  stepForward: () => {
    set((state) => {
      if (state.currentStepIndex < state.scopeSteps.length - 1) {
        return { currentStepIndex: state.currentStepIndex + 1 };
      }
      return { isPlaying: false };
    });
  },

  stepBackward: () => {
    set((state) => {
      if (state.currentStepIndex > 0) {
        return { currentStepIndex: state.currentStepIndex - 1 };
      }
      return {};
    });
  },

  reset: () => {
    set({ currentStepIndex: 0, isPlaying: false });
  },

  setCurrentStepIndex: (currentStepIndex: number) => {
    set((state) => ({
      currentStepIndex: Math.max(0, Math.min(currentStepIndex, state.scopeSteps.length - 1)),
    }));
  },

  setIsPlaying: (isPlaying: boolean) => {
    set({ isPlaying });
  },

  setPlaybackSpeedMs: (playbackSpeedMs: number) => {
    set({ playbackSpeedMs });
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
