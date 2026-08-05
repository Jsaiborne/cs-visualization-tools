import type {
  DFAConfig,
  NFAConfig,
  TransitionEdge,
  DFATransitionTable,
  NFATransitionTable,
  ExecutionStep
} from '../types/automata';

/**
 * Builds an O(1) lookup table for DFA transitions: fromState -> (symbol -> toState)
 */
export function buildDFATransitionTable(transitions: TransitionEdge[]): DFATransitionTable {
  const table: DFATransitionTable = {};
  for (const t of transitions) {
    if (!table[t.from]) {
      table[t.from] = {};
    }
    table[t.from][t.symbol] = t.to;
  }
  return table;
}

/**
 * Builds an O(1) lookup table for NFA transitions: fromState -> (symbol -> toState[])
 */
export function buildNFATransitionTable(transitions: TransitionEdge[]): NFATransitionTable {
  const table: NFATransitionTable = {};
  for (const t of transitions) {
    if (!table[t.from]) {
      table[t.from] = {};
    }
    if (!table[t.from][t.symbol]) {
      table[t.from][t.symbol] = [];
    }
    table[t.from][t.symbol].push(t.to);
  }
  return table;
}

/**
 * Pure, UI-agnostic DFA traversal engine.
 * Takes a DFA configuration and input string, returns array of ExecutionStep snapshots for time-travel visualizer.
 */
export function simulateDFA(dfa: DFAConfig, inputString: string): ExecutionStep[] {
  const table = dfa.transitionTable || buildDFATransitionTable(dfa.transitions);
  const alphabetSet = new Set(dfa.alphabet);
  const acceptSet = new Set(dfa.acceptStateIds);

  const steps: ExecutionStep[] = [];
  let currentState = dfa.startStateId;

  // Step 0: Initial State Snapshot
  steps.push({
    stepIndex: 0,
    currentStateId: currentState,
    currentSymbol: null,
    consumedInput: '',
    remainingInput: inputString,
    status: 'PENDING',
    description: `Initial state: ${currentState}. Ready to process input string "${inputString}".`
  });

  // Handle empty input string case
  if (inputString.length === 0) {
    const isAccept = acceptSet.has(currentState);
    steps[0].status = isAccept ? 'ACCEPTED' : 'REJECTED';
    steps[0].description = `Empty string test. State ${currentState} is ${isAccept ? 'an ACCEPT' : 'a REJECT'} state.`;
    return steps;
  }

  // Traversal loop
  for (let i = 0; i < inputString.length; i++) {
    const symbol = inputString[i];
    const consumed = inputString.slice(0, i + 1);
    const remaining = inputString.slice(i + 1);

    // Validate symbol against alphabet
    if (alphabetSet.size > 0 && !alphabetSet.has(symbol)) {
      steps.push({
        stepIndex: i + 1,
        currentStateId: currentState,
        currentSymbol: symbol,
        consumedInput: inputString.slice(0, i),
        remainingInput: inputString.slice(i),
        status: 'REJECTED',
        description: `Invalid symbol '${symbol}' not in alphabet Σ = {${dfa.alphabet.join(', ')}}`
      });
      return steps;
    }

    const nextState = table[currentState]?.[symbol];

    // Find edge ID for UI highlighting
    const edge = dfa.transitions.find((t) => t.from === currentState && t.symbol === symbol && t.to === nextState);

    if (!nextState) {
      steps.push({
        stepIndex: i + 1,
        currentStateId: currentState,
        currentSymbol: symbol,
        consumedInput: inputString.slice(0, i),
        remainingInput: inputString.slice(i),
        status: 'REJECTED',
        description: `No transition defined from state ${currentState} on symbol '${symbol}'. Automaton trapped.`
      });
      return steps;
    }

    currentState = nextState;

    steps.push({
      stepIndex: i + 1,
      currentStateId: currentState,
      currentSymbol: symbol,
      consumedInput: consumed,
      remainingInput: remaining,
      status: 'STEPPING',
      activeTransitionId: edge?.id,
      description: `Read symbol '${symbol}': Transitioned from ${edge?.from || '?'} -> ${currentState}`
    });
  }

  // Final Step Status Evaluation
  const isAccept = acceptSet.has(currentState);
  const finalIndex = steps.length - 1;
  steps[finalIndex].status = isAccept ? 'ACCEPTED' : 'REJECTED';
  steps[finalIndex].description += ` -> Reached state ${currentState} (${isAccept ? 'ACCEPTED' : 'REJECTED'})`;

  return steps;
}

/**
 * Computes Epsilon (ε) Closure for an NFA state set
 */
export function getEpsilonClosure(stateIds: string[], table: NFATransitionTable): string[] {
  const closure = new Set<string>(stateIds);
  const stack = [...stateIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const epsTargets = table[current]?.['ε'] || table[current]?.['e'] || table[current]?.['eps'] || [];
    for (const target of epsTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target);
      }
    }
  }

  return Array.from(closure);
}

/**
 * Pure, UI-agnostic NFA traversal engine with set-of-states tracking and Epsilon closures.
 */
export function simulateNFA(nfa: NFAConfig, inputString: string): ExecutionStep[] {
  const table = nfa.transitionTable || buildNFATransitionTable(nfa.transitions);
  const acceptSet = new Set(nfa.acceptStateIds);

  let currentStates = getEpsilonClosure([nfa.startStateId], table);
  const steps: ExecutionStep[] = [];

  steps.push({
    stepIndex: 0,
    currentStateId: currentStates.join(', '),
    currentNFAStateIds: currentStates,
    currentSymbol: null,
    consumedInput: '',
    remainingInput: inputString,
    status: 'PENDING',
    description: `Initial state set (with ε-closure): { ${currentStates.join(', ')} }`
  });

  for (let i = 0; i < inputString.length; i++) {
    const symbol = inputString[i];
    const consumed = inputString.slice(0, i + 1);
    const remaining = inputString.slice(i + 1);

    const nextStateSet = new Set<string>();
    for (const s of currentStates) {
      const targets = table[s]?.[symbol] || [];
      for (const t of targets) {
        nextStateSet.add(t);
      }
    }

    const nextStatesWithEps = getEpsilonClosure(Array.from(nextStateSet), table);

    if (nextStatesWithEps.length === 0) {
      steps.push({
        stepIndex: i + 1,
        currentStateId: 'Ø',
        currentNFAStateIds: [],
        currentSymbol: symbol,
        consumedInput: inputString.slice(0, i),
        remainingInput: inputString.slice(i),
        status: 'REJECTED',
        description: `No active paths remaining on symbol '${symbol}'. Computation halted.`
      });
      return steps;
    }

    currentStates = nextStatesWithEps;

    steps.push({
      stepIndex: i + 1,
      currentStateId: currentStates.join(', '),
      currentNFAStateIds: currentStates,
      currentSymbol: symbol,
      consumedInput: consumed,
      remainingInput: remaining,
      status: 'STEPPING',
      description: `Read symbol '${symbol}': Active state set -> { ${currentStates.join(', ')} }`
    });
  }

  const isAccept = currentStates.some((s) => acceptSet.has(s));
  const finalIndex = steps.length - 1;
  steps[finalIndex].status = isAccept ? 'ACCEPTED' : 'REJECTED';
  steps[finalIndex].description += ` (${isAccept ? 'ACCEPTED' : 'REJECTED'})`;

  return steps;
}
