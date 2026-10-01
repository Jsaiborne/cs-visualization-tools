import { create } from 'zustand';
import type { SubsetResult } from '../core/automata/subsetConstruction';
import type { MinimizeResult } from '../core/automata/minimize';

/**
 * The construction shown in the toolkit panel.
 * - subset: the canvas shows the resulting DFA; `step` reveals it row by row.
 * - minimize: the canvas keeps the source DFA, colored by partition block for `step` (a round);
 *   `applied` once the minimized DFA has been loaded.
 */
export type Construction =
  | { kind: 'subset'; result: SubsetResult; step: number }
  | {
      kind: 'minimize';
      result: MinimizeResult;
      sourceId: string;
      /** Labels of the source DFA's states (the canvas may show the minimized DFA later) */
      labels: Record<string, string>;
      step: number;
      applied: boolean;
    };

interface ToolkitState {
  construction: Construction | null;
  setConstruction: (construction: Construction | null) => void;
  setStep: (step: number) => void;
  markApplied: () => void;
}

export const useToolkitStore = create<ToolkitState>((set) => ({
  construction: null,
  setConstruction: (construction) => set({ construction }),
  setStep: (step) =>
    set((state) => (state.construction ? { construction: { ...state.construction, step } } : {})),
  markApplied: () =>
    set((state) =>
      state.construction?.kind === 'minimize' ? { construction: { ...state.construction, applied: true } } : {}
    ),
}));

// Partition blocks are told apart by category colors (not the accept/reject status colors)
export const BLOCK_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--text)',
  'var(--text-muted)',
];

export interface CanvasDecorations {
  fadedStates: Set<string>;
  fadedEdgesFrom: Set<string>;
  highlighted: string | null;
  groupColor: Map<string, string>;
}

const NONE: CanvasDecorations = {
  fadedStates: new Set(),
  fadedEdgesFrom: new Set(),
  highlighted: null,
  groupColor: new Map(),
};

/**
 * How the canvas should decorate the machine with id `automatonId` for the current construction
 * step. Returns no decorations when the construction is about a different machine.
 */
export function canvasDecorations(construction: Construction | null, automatonId: string): CanvasDecorations {
  if (!construction) return NONE;

  if (construction.kind === 'subset') {
    const { result, step } = construction;
    if (result.dfa.id !== automatonId) return NONE;
    // Steps are DFA rows in processing order: rows < step are processed, their targets discovered
    const processed = result.steps.slice(0, step);
    const discovered = new Set([result.dfa.startStateId]);
    for (const row of processed) for (const move of row.moves) discovered.add(move.targetDfaStateId);
    const done = step >= result.steps.length;
    return {
      fadedStates: done ? new Set() : new Set(result.dfa.states.map((s) => s.id).filter((id) => !discovered.has(id))),
      fadedEdgesFrom: done
        ? new Set()
        : new Set(result.dfa.states.map((s) => s.id).filter((id) => !processed.some((r) => r.dfaStateId === id))),
      highlighted: processed.at(-1)?.dfaStateId ?? null,
      groupColor: new Map(),
    };
  }

  if (construction.applied || construction.sourceId !== automatonId) return NONE;
  const round = construction.result.rounds[construction.step] ?? construction.result.rounds.at(-1);
  const groupColor = new Map<string, string>();
  round?.blocks.forEach((block, i) => block.forEach((s) => groupColor.set(s, BLOCK_COLORS[i % BLOCK_COLORS.length])));
  return {
    fadedStates: new Set(construction.result.unreachable),
    fadedEdgesFrom: new Set(construction.result.unreachable),
    highlighted: null,
    groupColor,
  };
}
