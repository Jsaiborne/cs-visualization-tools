/**
 * Time-travel playback controls shared by every step-based store
 * (automata, LL(1) grammar, scope analysis).
 */
export interface PlaybackState {
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  setStepIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeedMs: (speedMs: number) => void;
}

type SetState<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;

export function createPlaybackSlice<S extends PlaybackState>(
  set: SetState<S>,
  stepCount: (state: S) => number
): PlaybackState {
  return {
    currentStepIndex: 0,
    isPlaying: false,
    playbackSpeedMs: 800,

    stepForward: () =>
      set((state) =>
        state.currentStepIndex < stepCount(state) - 1
          ? ({ currentStepIndex: state.currentStepIndex + 1 } as Partial<S>)
          : ({ isPlaying: false } as Partial<S>)
      ),

    stepBackward: () =>
      set((state) =>
        state.currentStepIndex > 0 ? ({ currentStepIndex: state.currentStepIndex - 1 } as Partial<S>) : {}
      ),

    reset: () => set({ currentStepIndex: 0, isPlaying: false } as Partial<S>),

    setStepIndex: (index) =>
      set((state) =>
        index >= 0 && index < stepCount(state) ? ({ currentStepIndex: index } as Partial<S>) : {}
      ),

    setIsPlaying: (isPlaying) => set({ isPlaying } as Partial<S>),

    setPlaybackSpeedMs: (playbackSpeedMs) => set({ playbackSpeedMs } as Partial<S>),
  };
}
