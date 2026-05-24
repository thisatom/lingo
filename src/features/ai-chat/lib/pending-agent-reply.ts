const pendingReplyChatIds = new Set<string>()

/** User message is already in the thread; run the agent when the pipeline is free. */
export function markPendingAgentReply(chatId: string): void {
  pendingReplyChatIds.add(chatId)
}

export function clearPendingAgentReply(chatId: string): void {
  pendingReplyChatIds.delete(chatId)
}

export function hasPendingAgentReply(chatId: string): boolean {
  return pendingReplyChatIds.has(chatId)
}

export function consumePendingAgentReply(chatId: string): boolean {
  if (!pendingReplyChatIds.has(chatId)) return false
  pendingReplyChatIds.delete(chatId)
  return true
}

/** Test helper */
export function resetPendingAgentReplies(): void {
  pendingReplyChatIds.clear()
}
