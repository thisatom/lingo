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

/** End stream session for this chat only (does not clear another chat's in-flight turn). */
export function clearAgentStreamSessionIfChat(chatId: string): void {
  if (streamActive && streamChatId === chatId) {
    streamChatId = null
    streamActive = false
  }
}

type StreamBindingSession = {
  getStreamTargetChatId: () => string | null
  setStreamController: (controller: null) => void
  setStreamTargetChatId: (chatId: string | null) => void
  setStreamActive: (active: boolean) => void
}

/** Drop renderer stream refs for a finished turn (always clear global stream session for the chat). */
export function endAgentTurnStreamBinding(
  targetChatId: string,
  session: StreamBindingSession
): void {
  if (session.getStreamTargetChatId() === targetChatId) {
    session.setStreamController(null)
    session.setStreamTargetChatId(null)
    session.setStreamActive(false)
  }
  clearAgentStreamSessionIfChat(targetChatId)
}
