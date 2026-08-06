import type {
  TMConfig,
  TMTransitionRule,
  ExecutionStep,
  TMDirection,
} from '../../types/automata';

export type { TMConfig, TMTransitionRule, TMDirection };

/**
 * Pure, UI-agnostic Turing Machine execution engine.
 *
 * Models a 1D bi-infinite tape memory, head movement (L/R/N), symbol rewriting,
 * and state transitions. Generates strongly-typed ExecutionStep snapshots for time-travel visualizer.
 *
 * @param config Turing Machine configuration (states, rules, start/accept states, blank symbol)
 * @param initialTape Input string loaded onto tape initially
 * @param maxSteps Prevention threshold for infinite loops (default 1000)
 * @returns Array of ExecutionStep snapshots
 */
export function simulateTM(
  config: TMConfig,
  initialTape: string,
  maxSteps: number = 1000
): ExecutionStep[] {
  const blank = config.blankSymbol || 'B';
  const steps: ExecutionStep[] = [];

  // Initialize tape array with initial tape string or a blank symbol if empty
  const tape: string[] = initialTape.length > 0 ? initialTape.split('') : [blank];
  let head = 0;
  let currentState = config.startStateId;

  // Step 0: Initial Snapshot
  steps.push({
    stepIndex: 0,
    currentStateId: currentState,
    currentSymbol: tape[head] ?? blank,
    consumedInput: '',
    remainingInput: initialTape,
    status: 'PENDING',
    description: `Initial state '${currentState}'. Tape loaded with "${tape.join('')}". Head at pos 0.`,
    tapeState: [...tape],
    tapeHeadIndex: head,
  });

  // Check if start state is already accept or reject state
  if (currentState === config.acceptStateId) {
    steps[0].status = 'ACCEPTED';
    steps[0].description += ' (Accept State)';
    return steps;
  }
  if (config.rejectStateId && currentState === config.rejectStateId) {
    steps[0].status = 'REJECTED';
    steps[0].description += ' (Reject State)';
    return steps;
  }

  let stepCount = 0;

  while (stepCount < maxSteps) {
    stepCount++;

    // Read current symbol under tape head
    const currentSymbol = tape[head] ?? blank;

    // Look up matching transition rule: (currentState, currentSymbol)
    const rule = config.transitions.find(
      (r) => r.fromState === currentState && r.read === currentSymbol
    );

    if (!rule) {
      const isAccept = currentState === config.acceptStateId;
      const isReject = config.rejectStateId ? currentState === config.rejectStateId : false;
      const status = isAccept ? 'ACCEPTED' : 'REJECTED';

      steps.push({
        stepIndex: steps.length,
        currentStateId: currentState,
        currentSymbol: currentSymbol,
        consumedInput: '',
        remainingInput: '',
        status,
        description: isAccept
          ? `Reached Accept state '${currentState}'. Machine halted.`
          : isReject
          ? `Reached Reject state '${currentState}'. Machine halted.`
          : `No transition rule for state '${currentState}' reading '${currentSymbol}'. Machine halted.`,
        tapeState: [...tape],
        tapeHeadIndex: head,
      });
      return steps;
    }

    // 1. Write symbol onto tape
    tape[head] = rule.write;

    // 2. Move tape head
    if (rule.move === 'L') {
      head -= 1;
      if (head < 0) {
        // Prepend blank symbol to left of tape
        tape.unshift(blank);
        head = 0;
      }
    } else if (rule.move === 'R') {
      head += 1;
      if (head >= tape.length) {
        // Append blank symbol to right of tape
        tape.push(blank);
      }
    }

    // 3. Update active state
    currentState = rule.nextState;

    const isAccept = currentState === config.acceptStateId;
    const isReject = config.rejectStateId ? currentState === config.rejectStateId : false;

    let status: ExecutionStep['status'] = 'STEPPING';
    if (isAccept) status = 'ACCEPTED';
    else if (isReject) status = 'REJECTED';

    steps.push({
      stepIndex: steps.length,
      currentStateId: currentState,
      currentSymbol: rule.read,
      consumedInput: '',
      remainingInput: '',
      status,
      activeTransitionId: rule.id,
      description: `Rule [${rule.fromState}, '${rule.read}'] -> ['${rule.write}', ${rule.move}, ${rule.nextState}]: Wrote '${rule.write}', moved ${rule.move}, state -> ${rule.nextState}`,
      tapeState: [...tape],
      tapeHeadIndex: head,
    });

    if (isAccept || isReject) {
      return steps;
    }
  }

  // Max step limit safeguard
  steps.push({
    stepIndex: steps.length,
    currentStateId: currentState,
    currentSymbol: null,
    consumedInput: '',
    remainingInput: '',
    status: 'REJECTED',
    description: `Execution limit exceeded (${maxSteps} steps). Potential infinite loop detected.`,
    tapeState: [...tape],
    tapeHeadIndex: head,
  });

  return steps;
}
