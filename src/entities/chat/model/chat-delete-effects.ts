/** Side effects when a chat is deleted (registered from app / features). */
const onChatDeletedHandlers: ((chatId: string) => void)[] = []

export function registerChatDeletedHandler(handler: (chatId: string) => void): void {
  onChatDeletedHandlers.push(handler)
}

/** @internal Test-only reset. */
export function clearChatDeletedHandlers(): void {
  onChatDeletedHandlers.length = 0
}

export function notifyChatDeleted(chatId: string): void {
  for (const handler of onChatDeletedHandlers) {
    handler(chatId)
  }
}
