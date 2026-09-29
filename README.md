# cs-visualization-tools

An interactive, browser-only suite for exploring theory of computation and compiler construction. Every module turns a computation into a list of step snapshots that you can play, pause, and step through forwards and backwards.

## Modules

| Module | What it shows |
| --- | --- |
| **Automata & TM** | Build DFAs/NFAs by dragging states and connecting edges on a canvas, validate determinism and completeness, and simulate input strings. Tools: **NFA → DFA** (subset construction, step by step), **Minimize** (partition refinement, round by round) and **Compare** (language equivalence with the shortest distinguishing string). Switch to the Turing machine mode for a tape-and-rule-table simulator. |
| **Regex** | Compile a regular expression to an ε-NFA with Thompson's construction and simulate it. Supports `\|`, `*`, `+`, `?`, concatenation, and `()`. The automata tools work here too. |
| **LL(1) Parsing** | Enter a grammar (`A -> a B \| ε`), see FIRST/FOLLOW sets and the LL(1) table (conflicts highlighted), remove left recursion or left-factor step by step, and watch the stack-based parse build a parse tree top-down. |
| **LR Parsing** | The canonical item-set automaton and ACTION/GOTO tables for LR(0), SLR(1), LALR(1) and canonical LR(1), with each method's conflicts, and a shift-reduce parse that builds the tree bottom-up. |
| **Compiler AST & IR** | Type an arithmetic expression to see its tokens, AST (D3 tree), and three-address code. Hovering a node or instruction highlights its source range. The **Symbol Table** tab runs a scope analyzer over a small `let x = 1; { ... }` language, showing scope push/pop, shadowing, and semantic errors. |

Across modules:

- **Share** encodes the current module's work into the URL.
- **Library** saves work in the browser and imports/exports it as `.json` files.
- Automata export as PNG, SVG, TikZ (LaTeX `automata` library) or Graphviz DOT; trees export as SVG.
- Undo/redo in the automata builder, and keyboard shortcuts for playback (press the keyboard icon in the header to see them).

## Development

```sh
npm install
npm run dev       # start the Vite dev server
npm test          # run the Vitest suite once
npm run lint      # oxlint
npm run build     # type-check and build for production
```

## Project layout

```
src/
  core/        Pure, UI-free engines: DFA/NFA/TM simulation, regex → NFA,
               subset construction, minimization, equivalence, TikZ/DOT export,
               lexer/parser/TAC, FIRST/FOLLOW + LL(1), grammar transforms,
               LR(0)/SLR/LALR/LR(1), scope analysis
  store/       Zustand stores (one per module) sharing a playback slice
  components/  React UI: common shell (header, sidebar, landing page) and visualizers
  hooks/       Keyboard shortcuts, canvas image export
  utils/       Share links, save library, downloads
  types/       Shared type definitions
tools/
  dfa_oracle.py  Reference DFA simulator for cross-checking the TypeScript engine
```

The engines in `src/core` are plain functions with tests in `src/core/__tests__`.
