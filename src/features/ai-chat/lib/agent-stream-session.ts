let streamChatId: string | null = null
let streamActive = false

export function setAgentStreamSession(chatId: string | null, active: boolean): void {
  streamChatId = active ? chatId : null
  streamActive = active && chatId != null
}

export function getAgentStreamChatId(): string | null {
  return streamActive ? streamChatId : null
}

export function isAgentStreamActiveForChat(chatId: string): boolean {
  return streamActive && streamChatId === chatId
}

export function getBackgroundStreamChatId(activeChatId: string | null): string | null {
  if (!streamActive || !streamChatId || !activeChatId) return null
  return streamChatId !== activeChatId ? streamChatId : null
}
