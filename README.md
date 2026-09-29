# cs-visualization-tools

An interactive, browser-only suite for exploring theory of computation and compiler construction. Every module turns a computation into a list of step snapshots that you can play, pause, and step through forwards and backwards.

## Modules

| Module | What it shows |
| --- | --- |
| **Finite Automata & TM** | Build DFAs/NFAs by dragging states and connecting edges on a canvas, validate determinism and completeness, and simulate input strings. Switch to the Turing machine mode for a tape-and-rule-table simulator. |
| **Regex & Thompson** | Compile a regular expression to an ε-NFA with Thompson's construction and simulate it. Supports `\|`, `*`, `+`, `?`, concatenation, and `()`. |
| **CFG & Parsing** | Enter a grammar (`A -> a B \| ε`), see FIRST/FOLLOW sets and the LL(1) table (conflicts highlighted), and watch the stack-based parse of an input string. |
| **Compiler AST & IR** | Type an arithmetic expression to see its tokens, AST (D3 tree), and three-address code. Hovering a node or instruction highlights its source range. The **Symbol Table** tab runs a scope analyzer over a small `let x = 1; { ... }` language, showing scope push/pop, shadowing, and semantic errors. |

The **Share** button in the header encodes the current module's state into the URL.

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
               lexer/parser/TAC, FIRST/FOLLOW + LL(1), scope analysis
  store/       Zustand stores (one per module) sharing a playback slice
  components/  React UI: common shell (header, sidebar, landing page) and visualizers
  utils/       Share-link (URL state) encoding
  types/       Shared type definitions
tools/
  dfa_oracle.py  Reference DFA simulator for cross-checking the TypeScript engine
```

The engines in `src/core` are plain functions with tests in `src/core/__tests__`.
