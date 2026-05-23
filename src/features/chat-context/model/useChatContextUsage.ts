import { useCallback, useMemo } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { Message } from '@/entities/message/model/types'
import {
  getChatContextUsageDetails,
  trimMessagesForContext
} from '@/shared/lib/chat-context-usage'

const HIGH_USAGE_PERCENT = 85

export function useChatContextUsage(messages: readonly Message[], modelId: string) {
  const setChatMessages = useChatsStore((s) => s.setChatMessages)
  const activeChatId = useChatsStore((s) => s.activeChatId)
  const llmMaxTokens = useSettingsStore((s) => s.llmMaxTokens)

  const usage = useMemo(
    () =>
      messages.length > 0
        ? getChatContextUsageDetails(messages, modelId, llmMaxTokens)
        : null,
    [messages, modelId, llmMaxTokens]
  )

  const percent = usage?.percent ?? 0

  const resetContext = useCallback(() => {
    if (!activeChatId || messages.length === 0) return
    const trimmed = trimMessagesForContext(messages, modelId, 50, llmMaxTokens)
    if (trimmed.length === messages.length) return
    setChatMessages(activeChatId, trimmed)
  }, [activeChatId, messages, modelId, llmMaxTokens, setChatMessages])

  return {
    percent,
    usage,
    resetContext,
    isHigh: percent >= HIGH_USAGE_PERCENT,
    showIndicator: messages.length > 0
  }
}
