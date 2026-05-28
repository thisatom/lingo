import { useChatsStore } from '@/entities/chat/model/store'
import {
  useConversationStore,
  type PipelineSearchTarget,
  type PipelineStage
} from '@/entities/conversation/model/store'
import {
  getChatPipeline,
  patchChatPipeline
} from '@/features/ai-chat/lib/chat-pipeline-registry'

function isOnSettingsScreen(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hash.startsWith('#/settings')
  )
}

export function isViewingChat(chatId: string): boolean {
  return useChatsStore.getState().activeChatId === chatId && !isOnSettingsScreen()
}

export function clearPipelineDetailForChat(chatId: string): void {
  patchChatPipeline(chatId, {
    pipelineThinkingText: '',
    pipelineSearchTargets: [],
    pipelineSearchActiveUrl: null,
    pipelineStreamingAnswer: false
  })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().clearPipelineDetail()
  }
}

/** Updates per-chat pipeline; mirrors to UI when that chat is active. */
export function setPipelineStageForChat(chatId: string, stage: PipelineStage): void {
  patchChatPipeline(chatId, { stage })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setStage(stage)
    if (stage === 'idle') {
      useConversationStore.getState().clearPipelineDetail()
    }
  }
}

export function setPipelineStreamingAnswerForChat(
  chatId: string,
  streaming: boolean
): void {
  patchChatPipeline(chatId, { pipelineStreamingAnswer: streaming })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineStreamingAnswer(streaming)
  }
}

export function setPipelineErrorForChat(chatId: string, error: string | null): void {
  useChatsStore.getState().setChatHasError(chatId, Boolean(error))
  patchChatPipeline(chatId, { error })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setError(error)
  }
}

/** Voice / mic stages for the active chat (keeps per-chat registry in sync). */
export function setActiveChatPipelineStage(stage: PipelineStage): void {
  const chatId = useChatsStore.getState().activeChatId
  if (!chatId) {
    useConversationStore.getState().setStage(stage)
    if (stage === 'idle') {
      useConversationStore.getState().clearPipelineDetail()
    }
    return
  }
  setPipelineStageForChat(chatId, stage)
}

export function setPipelineThinkingForChat(chatId: string, text: string): void {
  patchChatPipeline(chatId, { pipelineThinkingText: text })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineThinkingText(text)
  }
}

export function appendPipelineThinkingForChat(chatId: string, chunk: string): void {
  if (!chunk) return
  const pipelineThinkingText = getChatPipeline(chatId).pipelineThinkingText + chunk
  patchChatPipeline(chatId, { pipelineThinkingText })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineThinkingText(pipelineThinkingText)
  }
}

export function setPipelineSearchTargetsForChat(
  chatId: string,
  targets: PipelineSearchTarget[]
): void {
  patchChatPipeline(chatId, { pipelineSearchTargets: targets })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineSearchTargets(targets)
  }
}

export function setPipelineSearchActiveUrlForChat(
  chatId: string,
  url: string | null
): void {
  patchChatPipeline(chatId, { pipelineSearchActiveUrl: url })
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineSearchActiveUrl(url)
  }
}
