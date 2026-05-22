/** Stable key: one restore per chat + saved position (not per turn). */
export function buildScrollRestoreSessionKey(
  chatId: string,
  savedScrollTop: number | null
): string {
  return `${chatId}:${savedScrollTop ?? 'bottom'}`
}

export function shouldSkipScrollRestore(
  completedKey: string | null,
  sessionKey: string
): boolean {
  return completedKey === sessionKey
}
