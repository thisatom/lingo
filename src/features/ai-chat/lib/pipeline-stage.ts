import { useChatsStore } from '@/entities/chat/model/store'
import {
  useConversationStore,
  type PipelineStage
} from '@/entities/conversation/model/store'

function isOnSettingsScreen(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.hash.startsWith('#/settings')
  )
}

export function isViewingChat(chatId: string): boolean {
  return useChatsStore.getState().activeChatId === chatId && !isOnSettingsScreen()
}

/** Updates global pipeline stage only when the user is viewing that chat. */
export function setPipelineStageForChat(chatId: string, stage: PipelineStage): void {
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setStage(stage)
    if (stage === 'idle') {
      useConversationStore.getState().setPipelineActivity(null)
    }
  }
}

export function setPipelineErrorForChat(chatId: string, error: string | null): void {
  useChatsStore.getState().setChatHasError(chatId, Boolean(error))
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setError(error)
  }
}

export function setPipelineActivityForChat(chatId: string, label: string | null): void {
  if (isViewingChat(chatId)) {
    useConversationStore.getState().setPipelineActivity(label)
  }
}
