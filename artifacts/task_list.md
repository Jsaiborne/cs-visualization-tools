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
- [x] **Custom React Flow AutomataNode (`src/components/visualizers/AutomataNode.tsx`)**: Glassmorphic custom node representing automaton states with double-concentric ring for accept states, start state indicators, and glowing cyan/purple neon box-shadows when `isActive` is true.
- [x] **DFA Canvas (`src/components/visualizers/DFACanvas.tsx`)**: React Flow canvas mapping automaton states to nodes and transitions to edge labels (`transition.symbol`) with animated active stroke highlights (`#38bdf8`) and directional arrowheads (`MarkerType.ArrowClosed`).
- [x] **Reactive Binding**: Subscribed reactively to `useAutomataStore`. Dynamically computes `activeStateId` and `activeTransitionId` based on `currentStepIndex` in real-time.

## Phase 4: Interactive Drag-and-Drop Automata Builder
- [x] **Store Synchronization (`src/store/useAutomataStore.ts`)**: Implemented two-way binding store actions: `addState(id, x, y)`, `removeElement(id)`, `addEdge(source, target, symbol)`, `toggleAcceptState(id)`, `setStartState(id)`, and `updateNodePosition(id, x, y)`.
- [x] **Real-time Validator (`validateAutomaton`)**: Real-time DFA determinism and completeness checking (detects missing start state, missing accept states, non-determinism, missing transition symbols per state, and unregistered symbols). Populates `validationErrors` array.
- [x] **Canvas Interactivity (`src/components/visualizers/DFACanvas.tsx`)**: Handled node dragging (`onNodeDragStop`), node/edge deletions (`onEdgesChange`), and interactive edge connection (`onConnect`).
- [x] **Edge Label UX Modal**: Interactive glassmorphic modal popping up on node connection to prompt for transition character(s) before finalizing edge creation in the store.
- [x] **Builder Toolbar (`src/components/visualizers/BuilderToolbar.tsx`)**: Floating panel over the canvas featuring glassmorphic buttons for `+ State`, `Make Start`, `Toggle Accept`, and `Delete`.
- [x] **Sidebar Validation Section (`src/components/common/Sidebar.tsx`)**: Added Real-Time Machine Validation panel displaying warnings list. Disables "Run Simulation" / Play controls when `validationErrors.length > 0`.
- [x] **Build Verification**: Verified production build compilation with `npx tsc --noEmit && npm run build` (**0 errors**).

## Phase 5: Lexer Engine & Interactive Token Stream Visualizer
- [x] **Compiler Types (`src/types/compiler.ts`)**: Defined `Token` interface with `{ type, value, start, end, line, column }` tracking exact character offsets.
- [x] **Lexer Core Scanner (`src/core/compiler/lexer.ts`)**: Built pure `tokenize(input)` function scanning numbers, math operators (`+`, `-`, `*`, `/`, `%`, `^`), left/right parentheses (`PAREN_L`, `PAREN_R`), identifiers/keywords, and unknown symbols while skipping whitespace and recording index ranges.
- [x] **Compiler Store (`src/store/useCompilerStore.ts`)**: Created Zustand store with Immer middleware for real-time synchronization between source code edits and token stream state.
- [x] **Code Editor Integration (`src/components/visualizers/CompilerEditor.tsx`)**: Split-pane layout embedding `@monaco-editor/react` with dark theme, JetBrains Mono font, and preset expression buttons.
- [x] **Token Stream UI (`src/components/visualizers/TokenStream.tsx`)**: Built interactive glassmorphic token stream cards with neon HSL semantic color coding, token count metrics bar, offset badges, and pop-in transitions.
- [x] **Canvas Viewport Integration (`src/components/visualizers/CanvasViewport.tsx`)**: Connected `CompilerEditor` view to the `COMPILER_AST` header navigation tab.

## Phase 6: Recursive Descent Parser & Interactive D3 AST Visualizer
- [x] **AST Node Definitions (`src/types/compiler.ts`)**: Defined `ProgramNode`, `NumericLiteralNode`, `IdentifierNode`, `BinaryExpressionNode`, and `ASTNode` union with exact `start` and `end` character offset ranges.
- [x] **Recursive Descent Parser (`src/core/compiler/parser.ts`)**: Built pure `parse(tokens)` function handling operator precedence (multiplication/division before addition/subtraction, parens grouping), computing accurate node index bounds, and throwing descriptive syntax errors.
- [x] **Compiler Store Updates (`src/store/useCompilerStore.ts`)**: Added `ast`, `parseError`, `selectedRange`, and `setSelectedRange()` to store, connecting tokenizer output to parser execution.
- [x] **D3.js AST Visualizer (`src/components/visualizers/ASTViewer.tsx`)**: Built hierarchical D3 tree diagram with SVG curved bezier links, glassmorphic node cards colored by type, D3 zoom & pan capabilities, and hover event listeners.
- [x] **Cross-Component Monaco Binding (`src/components/visualizers/CompilerEditor.tsx`)**: Connected D3 tree node hover (`selectedRange`) to Monaco Editor `deltaDecorations` to visually highlight matching source code substrings.

## Next Objectives
- [ ] Implement NFA set-of-states multi-active node visualizer & $\varepsilon$-closure step renderer.
- [ ] Implement Context-Free Grammar (CFG) & LR/LL Parser visualizer engine.
- [ ] Implement Intermediate Code Generation (3AC / TAC) visualizer.


