export const EPSILON = 'ε';

const EPSILON_ALIASES = new Set([EPSILON, 'eps', 'epsilon']);

/**
 * True when a transition/grammar symbol denotes the empty string.
 * Accepts 'ε' plus the ASCII spellings 'eps' / 'epsilon' — never a bare 'e',
 * which is a legitimate input symbol.
 */
export function isEpsilon(symbol: string): boolean {
  return EPSILON_ALIASES.has(symbol.toLowerCase());
}
