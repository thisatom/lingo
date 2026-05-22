/** Called by ConversationPanel to flush scrollTop into the chats store before disk persist. */
let flushChatScroll: (() => void) | null = null

export function registerChatScrollFlush(fn: () => void): () => void {
  flushChatScroll = fn
  return () => {
    if (flushChatScroll === fn) flushChatScroll = null
  }
}

export function flushChatScrollPositions(): void {
  flushChatScroll?.()
}
