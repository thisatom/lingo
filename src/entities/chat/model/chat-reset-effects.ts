/** Side effects when all chats are reset (registered from app / features). */
const onChatsResetHandlers: (() => void)[] = []

export function registerChatsResetHandler(handler: () => void): void {
  onChatsResetHandlers.push(handler)
}

/** @internal Test-only reset. */
export function clearChatsResetHandlers(): void {
  onChatsResetHandlers.length = 0
}

export function notifyChatsReset(): void {
  for (const handler of onChatsResetHandlers) {
    handler()
  }
}
