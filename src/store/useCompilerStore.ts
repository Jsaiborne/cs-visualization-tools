import { create } from 'zustand';
import { produce } from 'immer';
import type { Token, ASTNode, TACInstruction } from '../types/compiler';
import { tokenize } from '../core/compiler/lexer';
import { parse } from '../core/compiler/parser';
import { generateTAC } from '../core/compiler/tacGenerator';

export interface CodeRange {
  start: number;
  end: number;
}

interface CompilerState {
  sourceCode: string;
  tokens: Token[];
  activeTokenIndex: number | null;
  ast: ASTNode | null;
  tacInstructions: TACInstruction[];
  parseError: string | null;
  selectedRange: CodeRange | null;

  setSourceCode: (code: string) => void;
  setActiveTokenIndex: (index: number | null) => void;
  setSelectedRange: (range: CodeRange | null) => void;
}

const initialSource = '(5 + 32) * 4';
const initialTokens = tokenize(initialSource);
let initialAst: ASTNode | null = null;
let initialError: string | null = null;

try {
  initialAst = parse(initialTokens);
} catch (err) {
  initialError = (err as Error).message;
}

const initialTac = initialAst ? generateTAC(initialAst) : [];

export const useCompilerStore = create<CompilerState>((set) => ({
  sourceCode: initialSource,
  tokens: initialTokens,
  activeTokenIndex: null,
  ast: initialAst,
  tacInstructions: initialTac,
  parseError: initialError,
  selectedRange: null,

  setSourceCode: (code: string) =>
    set(
      produce((draft: CompilerState) => {
        draft.sourceCode = code;
        draft.tokens = tokenize(code);

        if (draft.activeTokenIndex !== null && draft.activeTokenIndex >= draft.tokens.length) {
          draft.activeTokenIndex = null;
        }

        try {
          draft.ast = parse(draft.tokens);
          draft.tacInstructions = draft.ast ? generateTAC(draft.ast) : [];
          draft.parseError = null;
        } catch (err) {
          draft.ast = null;
          draft.tacInstructions = [];
          draft.parseError = (err as Error).message;
        }
      })
    ),

  setActiveTokenIndex: (index: number | null) =>
    set(
      produce((draft: CompilerState) => {
        draft.activeTokenIndex = index;
      })
    ),

  setSelectedRange: (range: CodeRange | null) =>
    set(
      produce((draft: CompilerState) => {
        draft.selectedRange = range;
      })
    ),
}));
