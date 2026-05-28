import { registerActiveChatChangeHandler } from '@/entities/chat/model/active-chat-effects'
import { registerChatDeletedHandler } from '@/entities/chat/model/chat-delete-effects'
import { useChatsStore } from '@/entities/chat/model/store'
import { isBusyPipelineStage } from '@/features/ai-chat/lib/chat-agent-transitions'
import {
  hasPendingAgentReply,
  clearPendingAgentReply
} from '@/features/ai-chat/lib/pending-agent-reply'
import { stopAgentOnChatDeleted } from '@/features/ai-chat/lib/stop-agent-on-chat-delete'
import {
  useConversationStore,
  type PipelineSearchTarget,
  type PipelineStage
} from '@/entities/conversation/model/store'

export type ChatPipelineSnapshot = {
  stage: PipelineStage
  error: string | null
  pipelineThinkingText: string
  pipelineSearchTargets: PipelineSearchTarget[]
  pipelineSearchActiveUrl: string | null
  pipelineStreamingAnswer: boolean
}

const pipelineByChatId = new Map<string, ChatPipelineSnapshot>()

function defaultSnapshot(): ChatPipelineSnapshot {
  return {
    stage: 'idle',
    error: null,
    pipelineThinkingText: '',
    pipelineSearchTargets: [],
    pipelineSearchActiveUrl: null,
    pipelineStreamingAnswer: false
  }
}

export function getChatPipeline(chatId: string): ChatPipelineSnapshot {
  return pipelineByChatId.get(chatId) ?? defaultSnapshot()
}

export function patchChatPipeline(
  chatId: string,
  patch: Partial<ChatPipelineSnapshot>
): ChatPipelineSnapshot {
  const next = { ...getChatPipeline(chatId), ...patch }
  if (next.stage === 'idle') {
    next.pipelineThinkingText = ''
    next.pipelineSearchTargets = []
    next.pipelineSearchActiveUrl = null
    next.pipelineStreamingAnswer = false
  }
  pipelineByChatId.set(chatId, next)
  return next
}

export function clearChatPipeline(chatId: string): void {
  pipelineByChatId.delete(chatId)
}

function isOnSettingsScreen(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hash.startsWith('#/settings')
  )
}

/** Mirrors the active chat pipeline snapshot into the global conversation store. */
export function syncPipelineUiForActiveChat(): void {
  if (isOnSettingsScreen()) {
    useConversationStore.getState().setStage('idle')
    useConversationStore.getState().setError(null)
    useConversationStore.getState().clearPipelineDetail()
    return
  }

  const chatId = useChatsStore.getState().activeChatId
  if (!chatId) {
    useConversationStore.getState().setStage('idle')
    useConversationStore.getState().setError(null)
    useConversationStore.getState().clearPipelineDetail()
    return
  }

  const snap = getChatPipeline(chatId)
  useConversationStore.setState({
    stage: snap.stage,
    error: snap.error,
    pipelineThinkingText: snap.pipelineThinkingText,
    pipelineSearchTargets: snap.pipelineSearchTargets,
    pipelineSearchActiveUrl: snap.pipelineSearchActiveUrl,
    pipelineStreamingAnswer: snap.pipelineStreamingAnswer
  })
}

registerActiveChatChangeHandler(syncPipelineUiForActiveChat)
registerChatDeletedHandler((chatId) => {
  const pipelineBusy = isBusyPipelineStage(getChatPipeline(chatId).stage)
  const pendingReply = hasPendingAgentReply(chatId)
  clearChatPipeline(chatId)
  clearPendingAgentReply(chatId)
  stopAgentOnChatDeleted(chatId, { pipelineBusy, pendingReply })
})
