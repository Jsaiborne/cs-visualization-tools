import type { ActiveModule, CompilerTab } from './useUIStore';
import { useAutomataStore } from './useAutomataStore';
import { useGrammarStore } from './useGrammarStore';
import { useScopeStore } from './useScopeStore';
import { useLRStore } from './useLRStore';
import type { PlaybackState } from './playback';

export interface ActivePlayback {
  state: PlaybackState;
  stepCount: number;
}

/**
 * The step-based store behind the current view, i.e. the one the header's play/step controls
 * drive, or null when the view has no steps (home page, compiler tokens/AST/TAC tabs).
 */
export function getActivePlayback(module: ActiveModule, compilerTab: CompilerTab): ActivePlayback | null {
  switch (module) {
    case 'AUTOMATA':
    case 'REGEX': {
      const state = useAutomataStore.getState();
      return { state, stepCount: state.executionSteps.length };
    }
    case 'GRAMMAR': {
      const state = useGrammarStore.getState();
      return { state, stepCount: state.executionSteps.length };
    }
    case 'LR': {
      const state = useLRStore.getState();
      return { state, stepCount: state.simulation.steps.length };
    }
    case 'COMPILER_AST': {
      if (compilerTab !== 'SYMBOL_TABLE') return null;
      const state = useScopeStore.getState();
      return { state, stepCount: state.scopeSteps.length };
    }
    default:
      return null;
  }
}
