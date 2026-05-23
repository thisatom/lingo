/** Side effects when a chat is deleted (registered from app / features). */
let onChatDeleted: ((chatId: string) => void) | null = null

export function registerChatDeletedHandler(handler: (chatId: string) => void): void {
  onChatDeleted = handler
}

export function notifyChatDeleted(chatId: string): void {
  onChatDeleted?.(chatId)
}
