/** Called by ConversationPanel to flush scrollTop into the chats store before disk persist. */
let flushChatScroll: (() => void) | null = null

/** Scroll active chat to the latest message (registered by ConversationPanel). */
let followChatBottom: (() => void) | null = null

export function registerChatScrollFlush(fn: () => void): () => void {
  flushChatScroll = fn
  return () => {
    if (flushChatScroll === fn) flushChatScroll = null
  }
}

export function flushChatScrollPositions(): void {
  flushChatScroll?.()
}

export function registerChatFollowBottom(fn: () => void): () => void {
  followChatBottom = fn
  return () => {
    if (followChatBottom === fn) followChatBottom = null
  }
}

/** Pin and scroll to bottom; safe to call before/after new messages mount. */
export function requestChatFollowBottom(): void {
  followChatBottom?.()
}
