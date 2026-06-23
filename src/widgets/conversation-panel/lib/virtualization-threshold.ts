export const VIRTUALIZE_MESSAGE_THRESHOLD = 100
/** Hysteresis: stay virtualized until count drops below this (avoids remount flicker). */
export const VIRTUALIZE_OFF_THRESHOLD = 90

export function resolveVirtualizedTurnsActive(
  messageCount: number,
  previouslyActive: boolean
): boolean {
  if (messageCount >= VIRTUALIZE_MESSAGE_THRESHOLD) return true
  if (messageCount < VIRTUALIZE_OFF_THRESHOLD) return false
  return previouslyActive
}
