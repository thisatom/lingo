/** Side effects when the active chat changes (registered from app layer). */
let onActiveChatChange: (() => void) | null = null

export function registerActiveChatChangeHandler(handler: () => void): void {
  onActiveChatChange = handler
}

export function notifyActiveChatChange(): void {
  onActiveChatChange?.()
}
