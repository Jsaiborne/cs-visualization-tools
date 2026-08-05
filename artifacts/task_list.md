# Task List - Theory of Computation & Compiler Visualization Suite

## Phase 1: Environment & Project Scaffolding
- [x] Initialize Vite React + TypeScript project
- [x] Install dependencies (`@xyflow/react`, `d3`, `zustand`, `immer`, `@monaco-editor/react`, `lucide-react`)
- [x] Establish dark glassmorphism design tokens (`src/styles/tokens.css` and `src/styles/index.css`)
- [x] Configure SEO title tags, meta description, and Google Fonts (`Outfit` & `JetBrains Mono`)

## Phase 2: Core Automata Engine, Time-Travel Store & Base UI Shell
- [x] **Type Definitions (`src/types/automata.ts`)**: Define strict TypeScript interfaces for DFA, NFA, transitions, state nodes, lookup matrices, and `ExecutionStep` snapshots.
- [x] **Core Engine (`src/core/automata.ts`)**: Pure, UI-agnostic DFA & NFA traversal engines with O(1) transition lookup matrices and `ExecutionStep` snapshot generation.
- [x] **Time-Travel Store (`src/store/useAutomataStore.ts`)**: Zustand store with Immer middleware supporting `stepForward()`, `stepBackward()`, `reset()`, `runSimulation()`, and playback speed control.
- [x] **Base UI Shell (`src/components/common/`)**: Main layout, Header with time-travel controls & step counter badge, and Sidebar with step snapshot inspector, input tape breakdown, step trace timeline, and dedicated Google AdSense placeholder slot (`<div id="adsense-slot-sidebar"></div>`).

## Phase 3: Interactive DFA Player with React Flow
- [x] **Custom React Flow AutomataNode (`src/components/visualizers/AutomataNode.tsx`)**: Glassmorphic custom node representing automaton states, featuring double-concentric ring for accept states, start state indicators, and glowing cyan/purple neon box-shadows when `isActive` is true.
- [x] **DFA Canvas (`src/components/visualizers/DFACanvas.tsx`)**: React Flow canvas mapping automaton states to nodes and transitions to edge labels (`transition.symbol`) with animated active stroke highlights (`#38bdf8`) and directional arrowheads (`MarkerType.ArrowClosed`).
- [x] **Reactive Binding**: Subscribed reactively to `useAutomataStore`. Dynamically computes `activeStateId` and `activeTransitionId` based on `currentStepIndex` in real-time.
- [x] **Main Viewport Integration (`src/components/visualizers/CanvasViewport.tsx`)**: Mounted `DFACanvas` in the central viewport space between Header and Sidebar taking up full flex-grow space.
- [x] **Build Verification**: Verified production build and type checking with `npx tsc --noEmit && npm run build` (**0 errors**).

## Next Objectives
- [ ] Implement NFA set-of-states multi-active node visualizer & $\varepsilon$-closure step renderer.
- [ ] Implement Context-Free Grammar (CFG) & LR/LL Parser visualizer engine.
- [ ] Implement Monaco Editor integration for grammar & source code editing.
- [ ] Implement D3 AST tree visualization engine.
