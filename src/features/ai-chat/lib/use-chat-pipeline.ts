import { useSyncExternalStore } from 'react'
import {
  getChatPipeline,
  getChatPipelineRevision,
  subscribeChatPipelines,
  type ChatPipelineSnapshot
} from '@/features/ai-chat/lib/chat-pipeline-registry'

export function useChatPipeline(chatId: string): ChatPipelineSnapshot {
  useSyncExternalStore(
    subscribeChatPipelines,
    () => getChatPipelineRevision(chatId),
    () => 0
  )
  return getChatPipeline(chatId)
}

/** Primitive snapshot — safe for useSyncExternalStore without revision tracking. */
export function useChatPipelineStage(chatId: string): ChatPipelineSnapshot['stage'] {
  return useSyncExternalStore(
    subscribeChatPipelines,
    () => getChatPipeline(chatId).stage,
    () => 'idle' as const
  )
}
