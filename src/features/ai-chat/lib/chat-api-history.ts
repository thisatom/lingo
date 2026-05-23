import { useChatsStore } from '@/entities/chat/model/store'
import {
  getCachedApiHistory,
  historySignature,
  invalidateChatApiHistoryCache,
  setCachedApiHistory
} from '@/entities/chat/lib/chat-api-history-cache'
import { useSettingsStore } from '@/entities/settings/model/store'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'
import { trimMessagesToTokenBudget } from '@/shared/lib/chat-context-usage'
import { normalizeLlmMaxTokens } from '@/shared/lib/llm-max-tokens'
import { resolveMessagesForApi } from '@/shared/lib/resolve-chat-api-messages'
import type { ChatMessagePayload } from '@/shared/types/ipc'

export { invalidateChatApiHistoryCache } from '@/entities/chat/lib/chat-api-history-cache'

function withUserNameSystemPrompt(base: ChatMessagePayload[]): ChatMessagePayload[] {
  const { addressUserByName, displayName } = useSettingsStore.getState()
  const name = displayName?.trim()
  if (!addressUserByName || !name) return base

  return [
    {
      role: 'system',
      content: `The user's name is ${name}. Address the user by name when replying.`
    },
    ...base
  ]
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
  const visible = chat?.messages.filter(messageHasVisibleContent) ?? []
  const trimmed = trimMessagesToTokenBudget(
    visible,
    options.modelId,
    normalizeLlmMaxTokens(options.maxTokens)
  )
  const signature = historySignature(chatId, trimmed)
  const cached = getCachedApiHistory(signature)
  if (cached) {
    return withUserNameSystemPrompt(cached)
  }

  const base = await resolveMessagesForApi(trimmed)
  setCachedApiHistory(signature, chatId, base)

  return withUserNameSystemPrompt(base)
}
