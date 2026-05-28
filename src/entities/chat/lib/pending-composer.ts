/** Composer draft/attachments slot used before the first chat exists. */
export const PENDING_COMPOSER_CHAT_ID = '__pending__'

/** Placeholder user row for live Agent Speech before a chat is created. */
export const PENDING_VOICE_MESSAGE_ID = '__pending-voice__'

export function isPendingComposerChatId(chatId: string): boolean {
  return chatId === PENDING_COMPOSER_CHAT_ID
}

export function isPendingVoiceMessageId(messageId: string): boolean {
  return messageId === PENDING_VOICE_MESSAGE_ID
}

export function resolveComposerChatId(activeChatId: string | null): string {
  return activeChatId ?? PENDING_COMPOSER_CHAT_ID
}

/** Chat ids to clear after a user message is sent (active chat + pre-chat slot). */
export function composerDraftSlotsForChat(chatId: string): string[] {
  return chatId === PENDING_COMPOSER_CHAT_ID
    ? [PENDING_COMPOSER_CHAT_ID]
    : [chatId, PENDING_COMPOSER_CHAT_ID]
}

/** Strip ephemeral composer keys before persisting chat state. */
export function omitPendingComposerFromRecord<T>(
  record: Record<string, T> | undefined
): Record<string, T> {
  if (!record) return {}
  const { [PENDING_COMPOSER_CHAT_ID]: _removed, ...rest } = record
  return rest
}
