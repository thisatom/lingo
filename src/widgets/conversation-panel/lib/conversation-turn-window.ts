/** Initial turns rendered when opening a long chat (flat list, sticky headers). */
export const INITIAL_VISIBLE_TURNS = 32

/** How many older turns to reveal per "load earlier" action. */
export const TURN_LOAD_STEP = 24

export function initialHiddenTurnCount(totalTurns: number): number {
  return Math.max(0, totalTurns - INITIAL_VISIBLE_TURNS)
}

export function nextHiddenTurnCount(currentHidden: number): number {
  return Math.max(0, currentHidden - TURN_LOAD_STEP)
}

export function hiddenTurnsRemaining(currentHidden: number): number {
  return currentHidden
}
