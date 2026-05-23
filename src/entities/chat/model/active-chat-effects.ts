/** Side effects when the active chat changes (registered from app / features). */
const onActiveChatChangeHandlers: (() => void)[] = []

export function registerActiveChatChangeHandler(handler: () => void): void {
  onActiveChatChangeHandlers.push(handler)
}

/** @internal Test-only reset. */
export function clearActiveChatChangeHandlers(): void {
  onActiveChatChangeHandlers.length = 0
}

export function notifyActiveChatChange(): void {
  for (const handler of onActiveChatChangeHandlers) {
    handler()
  }
}
