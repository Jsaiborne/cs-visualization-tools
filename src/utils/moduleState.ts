import { useUIStore, type ActiveModule, type CompilerTab } from '../store/useUIStore';
import { useAutomataStore } from '../store/useAutomataStore';
import { useGrammarStore } from '../store/useGrammarStore';
import { useCompilerStore } from '../store/useCompilerStore';
import { useScopeStore } from '../store/useScopeStore';
import { useLRStore, LR_KINDS } from '../store/useLRStore';

export const ACTIVE_MODULES: ActiveModule[] = ['HOME', 'AUTOMATA', 'REGEX', 'GRAMMAR', 'LR', 'COMPILER_AST'];

export const MODULE_LABELS: Record<ActiveModule, string> = {
  HOME: 'Home',
  AUTOMATA: 'Finite Automata & TM',
  REGEX: 'Regex & Thompson',
  GRAMMAR: 'CFG & LL(1) Parsing',
  LR: 'LR Parsing',
  COMPILER_AST: 'Compiler AST & IR',
};

const COMPILER_TABS: CompilerTab[] = ['TOKENS', 'AST', 'TAC', 'SYMBOL_TABLE'];

export function isActiveModule(value: unknown): value is ActiveModule {
  return typeof value === 'string' && (ACTIVE_MODULES as string[]).includes(value);
}

/**
 * Snapshot of everything needed to restore a module's work (machine, grammar, source code).
 * Used by share links and the save library. Returns null for modules with nothing to save.
 */
export function captureModuleState(module: ActiveModule): Record<string, unknown> | null {
  switch (module) {
    case 'AUTOMATA':
    case 'REGEX': {
      const { automaton, testInput } = useAutomataStore.getState();
      return { automaton, testInput };
    }
    case 'GRAMMAR': {
      const { grammarText, testInput } = useGrammarStore.getState();
      return { grammarText, testInput };
    }
    case 'LR': {
      const { grammarText, testInput, kind } = useLRStore.getState();
      return { grammarText, testInput, kind };
    }
    case 'COMPILER_AST': {
      const { sourceCode } = useCompilerStore.getState();
      const scopeCode = useScopeStore.getState().sourceCode;
      const { compilerTab } = useUIStore.getState();
      return { sourceCode, scopeCode, compilerTab };
    }
    default:
      return null;
  }
}

/**
 * Restores a snapshot from captureModuleState into the stores. Untrusted input (share links,
 * imported files) is validated field by field; unknown or malformed fields are ignored.
 * Returns true if anything was applied.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- validated field by field below
export function applyModuleState(module: ActiveModule, data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  let applied = false;

  switch (module) {
    case 'AUTOMATA':
    case 'REGEX':
      if (data.automaton && typeof data.automaton === 'object' && Array.isArray(data.automaton.states)) {
        if (typeof data.testInput === 'string') {
          useAutomataStore.getState().setTestInput(data.testInput);
        }
        useAutomataStore.getState().setAutomaton(data.automaton);
        applied = true;
      }
      break;
    case 'GRAMMAR':
      if (typeof data.grammarText === 'string') {
        useGrammarStore.getState().setGrammarText(data.grammarText);
        if (typeof data.testInput === 'string') {
          useGrammarStore.getState().setTestInput(data.testInput);
        }
        applied = true;
      }
      break;
    case 'LR':
      if (typeof data.grammarText === 'string') {
        const lr = useLRStore.getState();
        if (LR_KINDS.includes(data.kind)) lr.setKind(data.kind);
        lr.setGrammarText(data.grammarText);
        if (typeof data.testInput === 'string') useLRStore.getState().setTestInput(data.testInput);
        applied = true;
      }
      break;
    case 'COMPILER_AST':
      if (typeof data.sourceCode === 'string') {
        useCompilerStore.getState().setSourceCode(data.sourceCode);
        applied = true;
      }
      if (typeof data.scopeCode === 'string') {
        useScopeStore.getState().setSourceCode(data.scopeCode);
        applied = true;
      }
      if (COMPILER_TABS.includes(data.compilerTab)) {
        useUIStore.getState().setCompilerTab(data.compilerTab);
      }
      break;
  }

  return applied;
}
