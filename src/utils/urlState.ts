import { useUIStore, type ActiveModule } from '../store/useUIStore';
import { useAutomataStore } from '../store/useAutomataStore';
import { useGrammarStore } from '../store/useGrammarStore';
import { useCompilerStore } from '../store/useCompilerStore';
import { useScopeStore } from '../store/useScopeStore';

/**
 * Safely serialize any JS object to a URL-safe Base64 string.
 */
export function serializeState(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    const encodedStr = encodeURIComponent(jsonStr);
    return btoa(encodedStr);
  } catch (err) {
    console.error('Failed to serialize state:', err);
    return '';
  }
}

/**
 * Safely deserialize a URL Base64 string back into a JS object.
 */
export function deserializeState<T>(encoded: string): T | null {
  try {
    const decodedStr = atob(encoded);
    const jsonStr = decodeURIComponent(decodedStr);
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Failed to deserialize state:', err);
    return null;
  }
}

/**
 * Generate a shareable URL containing serialized state for the current active module.
 */
export function getShareableURL(): string {
  const activeModule = useUIStore.getState().activeModule;
  let statePayload: any = null;

  if (activeModule === 'AUTOMATA' || activeModule === 'REGEX') {
    const { automaton } = useAutomataStore.getState();
    statePayload = { automaton };
  } else if (activeModule === 'GRAMMAR') {
    const { grammarText, testInput } = useGrammarStore.getState();
    statePayload = { grammarText, testInput };
  } else if (activeModule === 'COMPILER_AST') {
    const { sourceCode } = useCompilerStore.getState();
    const scopeCode = useScopeStore.getState().sourceCode;
    statePayload = { sourceCode, scopeCode };
  }

  const encodedState = statePayload ? serializeState(statePayload) : '';
  const url = new URL(window.location.href);
  url.searchParams.set('module', activeModule);
  if (encodedState) {
    url.searchParams.set('state', encodedState);
  } else {
    url.searchParams.delete('state');
  }

  return url.toString();
}

/**
 * Read query parameters on app mount and hydrate stores if valid state is found.
 */
export function loadStateFromURL(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const moduleParam = params.get('module') as ActiveModule | null;
    const stateParam = params.get('state');

    if (!moduleParam) return false;

    // Set active module in UI store
    const validModules: ActiveModule[] = ['HOME', 'AUTOMATA', 'REGEX', 'GRAMMAR', 'COMPILER_AST'];
    if (validModules.includes(moduleParam)) {
      useUIStore.getState().setActiveModule(moduleParam);
    }

    if (stateParam) {
      const data = deserializeState<any>(stateParam);
      if (data) {
        if (data.automaton && (moduleParam === 'AUTOMATA' || moduleParam === 'REGEX')) {
          useAutomataStore.getState().setAutomaton(data.automaton);
        }
        if (data.grammarText && moduleParam === 'GRAMMAR') {
          useGrammarStore.getState().setGrammarText(data.grammarText);
          if (data.testInput) {
            useGrammarStore.getState().setTestInput(data.testInput);
          }
        }
        if (moduleParam === 'COMPILER_AST') {
          if (data.sourceCode) {
            useCompilerStore.getState().setSourceCode(data.sourceCode);
          }
          if (data.scopeCode) {
            useScopeStore.getState().setSourceCode(data.scopeCode);
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to hydrate state from URL:', err);
    return false;
  }
}
