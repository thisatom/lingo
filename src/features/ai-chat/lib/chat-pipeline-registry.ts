import { registerChatDeletedHandler } from '@/entities/chat/model/chat-delete-effects'
import { registerChatsResetHandler } from '@/entities/chat/model/chat-reset-effects'
import { useChatsStore } from '@/entities/chat/model/store'
import { clearPendingAgentReply } from '@/features/ai-chat/lib/pending-agent-reply'
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
const pipelineRevisionByChatId = new Map<string, number>()
const pipelineListeners = new Set<() => void>()

function notifyPipelineListeners(): void {
  pipelineListeners.forEach((listener) => listener())
}

function bumpPipelineRevision(chatId: string): void {
  pipelineRevisionByChatId.set(chatId, (pipelineRevisionByChatId.get(chatId) ?? 0) + 1)
}

export function getChatPipelineRevision(chatId: string): number {
  return pipelineRevisionByChatId.get(chatId) ?? 0
}

/** Subscribe to any per-chat pipeline snapshot change (for sidebar indicators, etc.). */
export function subscribeChatPipelines(onStoreChange: () => void): () => void {
  pipelineListeners.add(onStoreChange)
  return () => {
    pipelineListeners.delete(onStoreChange)
  }
}

const IDLE_CHAT_PIPELINE: ChatPipelineSnapshot = {
  stage: 'idle',
  error: null,
  pipelineThinkingText: '',
  pipelineSearchTargets: [],
  pipelineSearchActiveUrl: null,
  pipelineStreamingAnswer: false
}

export function getChatPipeline(chatId: string): ChatPipelineSnapshot {
  return pipelineByChatId.get(chatId) ?? IDLE_CHAT_PIPELINE
}

export function patchChatPipeline(
  chatId: string,
  patch: Partial<ChatPipelineSnapshot>
): ChatPipelineSnapshot {
  const prev = pipelineByChatId.get(chatId) ?? IDLE_CHAT_PIPELINE
  const next = { ...prev, ...patch }
  if (next.stage === 'idle') {
    next.pipelineThinkingText = ''
    next.pipelineSearchTargets = []
    next.pipelineSearchActiveUrl = null
    next.pipelineStreamingAnswer = false
  }
  pipelineByChatId.set(chatId, next)
  bumpPipelineRevision(chatId)
  notifyPipelineListeners()
  return next
}

export function clearChatPipeline(chatId: string): void {
  if (!pipelineByChatId.has(chatId) && !pipelineRevisionByChatId.has(chatId)) return
  pipelineByChatId.delete(chatId)
  bumpPipelineRevision(chatId)
  notifyPipelineListeners()
}

export function clearAllChatPipelines(): void {
  if (pipelineByChatId.size === 0) return
  const chatIds = [...pipelineByChatId.keys()]
  pipelineByChatId.clear()
  for (const chatId of chatIds) {
    bumpPipelineRevision(chatId)
  }
  notifyPipelineListeners()
}

function isOnSettingsScreen(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hash.startsWith('#/settings')
  )
}

/** Mirrors the active chat pipeline snapshot into the global conversation store. */
export function syncPipelineUiForActiveChat(): void {
  useConversationStore.getState().setQueueAheadPreview(null)
  useConversationStore.getState().setSpeechError(null)

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

registerChatDeletedHandler((chatId) => {
  clearChatPipeline(chatId)
  clearPendingAgentReply(chatId)
  stopAgentOnChatDeleted(chatId)
})

registerChatsResetHandler(() => {
  clearAllChatPipelines()
  useConversationStore.getState().resetPipeline()
})
