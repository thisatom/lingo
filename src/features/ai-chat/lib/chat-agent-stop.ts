import { useChatsStore } from '@/entities/chat/model/store'
import { useMessageQueueStore } from '@/entities/message-queue/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { cancelAgentRun } from '@/features/ai-chat/model/agent-run'
import { getAgentStreamChatId, setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { clearPendingAgentReply } from '@/features/ai-chat/lib/pending-agent-reply'
import {
  clearPipelineDetailForChat,
  setPipelineErrorForChat,
  setPipelineStageForChat,
  setPipelineStreamingAnswerForChat
} from '@/features/ai-chat/lib/pipeline-stage'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'
import type { ChatStreamController } from '@/shared/types/ipc'
import type { StreamingSentenceTts } from '@/features/text-to-speech/model/streamingSentenceTts'

export type AgentStopOptions = {
  force?: boolean
  chatId?: string | null
}

export type AgentStopContext = {
  streamController: ChatStreamController | null
  streamTargetChatId: string | null
  streamingTts: StreamingSentenceTts | null
  setStreamController: (controller: ChatStreamController | null) => void
  setStreamTargetChatId: (chatId: string | null) => void
  setStreamActive: (active: boolean) => void
  setStreamingTts: (tts: StreamingSentenceTts | null) => void
  setBlurAnimateMessageId: (id: string | null) => void
  setGlobalStageIdle: () => void
}

/** Whether stop should run (scoped stop ignores other chat streams). */
export function shouldProceedWithAgentStop(options: {
  force: boolean
  streamChatId: string | null
  scopeChatId: string | null
}): boolean {
  const { force, streamChatId, scopeChatId } = options
  if (force) return true
  if (!streamChatId || !scopeChatId) return true
  return streamChatId === scopeChatId
}

export function resolveAgentStopChatId(options: {
  streamChatId: string | null
  scopeChatId: string | null
  activeChatId: string | null
}): string | null {
  return options.streamChatId ?? options.scopeChatId ?? options.activeChatId
}

export function chatIdsToClearOnForceStop(
  streamChatId: string | null,
  scopeChatId: string | null,
  resolvedChatId: string | null
): string[] {
  return [...new Set([streamChatId, scopeChatId, resolvedChatId].filter(Boolean) as string[])]
}

/** Stops in-flight stream, TTS, pipeline, and optionally queue/pending (force). */
export function executeAgentStop(
  options: AgentStopOptions,
  ctx: AgentStopContext
): boolean {
  const { force = false, chatId: scopeChatId = null } = options
  const streamChatId = ctx.streamTargetChatId ?? getAgentStreamChatId()

  if (!shouldProceedWithAgentStop({ force, streamChatId, scopeChatId })) {
    return false
  }

  ctx.streamController?.abort()
  ctx.setStreamController(null)
  ctx.setStreamActive(false)
  setAgentStreamSession(null, false)
  ctx.streamingTts?.cancel()
  ctx.setStreamingTts(null)
  cancelAgentRun()
  stopTtsPlayback()
  ctx.setBlurAnimateMessageId(null)
  useConversationStore.getState().setQueueAheadPreview(null)
  ctx.setStreamTargetChatId(null)

  const chatId = resolveAgentStopChatId({
    streamChatId,
    scopeChatId,
    activeChatId: useChatsStore.getState().activeChatId
  })

  if (force) {
    for (const id of chatIdsToClearOnForceStop(streamChatId, scopeChatId, chatId)) {
      useMessageQueueStore.getState().clearChat(id)
      clearPendingAgentReply(id)
    }
  }

  if (chatId && useChatsStore.getState().chats.some((c) => c.id === chatId)) {
    setPipelineStreamingAnswerForChat(chatId, false)
    clearPipelineDetailForChat(chatId)
    setPipelineErrorForChat(chatId, null)
    setPipelineStageForChat(chatId, 'idle')
  } else {
    ctx.setGlobalStageIdle()
  }

  return true
}
