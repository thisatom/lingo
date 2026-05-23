import { useChatsStore } from '@/entities/chat/model/store'
import {
  getCachedApiHistory,
  historySignature,
  invalidateChatApiHistoryCache,
  setCachedApiHistory
} from '@/entities/chat/lib/chat-api-history-cache'
import { useSettingsStore } from '@/entities/settings/model/store'
import { normalizeAlternatingChatMessages } from '@/shared/lib/chat-api-alternation'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'
import { trimMessagesToTokenBudgetWithMeta } from '@/shared/lib/chat-context-usage'
import { normalizeLlmMaxTokens } from '@/shared/lib/llm-max-tokens'
import { resolveMessagesForApi } from '@/shared/lib/resolve-chat-api-messages'
import type { ChatMessagePayload } from '@/shared/types/ipc'

export { invalidateChatApiHistoryCache } from '@/entities/chat/lib/chat-api-history-cache'

function withExtraSystemPrompts(
  base: ChatMessagePayload[],
  extras: string[]
): ChatMessagePayload[] {
  const prompts = extras.filter((line) => line.trim().length > 0)
  if (prompts.length === 0) return base
  return [
    ...prompts.map((content) => ({ role: 'system' as const, content })),
    ...base
  ]
}

function withUserNameSystemPrompt(base: ChatMessagePayload[]): ChatMessagePayload[] {
  const { addressUserByName, displayName } = useSettingsStore.getState()
  const name = displayName?.trim()
  if (!addressUserByName || !name) return base

  return withExtraSystemPrompts(base, [
    `The user's name is ${name}. Address the user by name when replying.`
  ])
}

export type ChatApiHistoryOptions = {
  modelId: string
  maxTokens: number
}

export async function getHistoryForApi(
  chatId: string,
  options: ChatApiHistoryOptions
): Promise<ChatMessagePayload[]> {
  const chat = useChatsStore.getState().chats.find((c) => c.id === chatId)
  const visible =
    chat?.messages.filter(
      (m) => messageHasVisibleContent(m) && m.role !== 'thinking'
    ) ?? []
  const alternating = normalizeAlternatingChatMessages(visible)
  const { messages: trimmed, historyTruncated } = trimMessagesToTokenBudgetWithMeta(
    alternating,
    options.modelId,
    normalizeLlmMaxTokens(options.maxTokens)
  )
  const signature = historySignature(chatId, trimmed)
  const cached = getCachedApiHistory(signature)
  if (cached) {
    const extras: string[] = []
    if (historyTruncated) {
      extras.push(
        'Older messages in this chat were omitted due to context limits. Use only the conversation below; do not invent earlier facts.'
      )
    }
    return withUserNameSystemPrompt(withExtraSystemPrompts(cached, extras))
  }

  const base = await resolveMessagesForApi(trimmed)
  setCachedApiHistory(signature, chatId, base)

  const extras: string[] = []
  if (historyTruncated) {
    extras.push(
      'Older messages in this chat were omitted due to context limits. Use only the conversation below; do not invent earlier facts.'
    )
  }
  return withUserNameSystemPrompt(withExtraSystemPrompts(base, extras))
}
