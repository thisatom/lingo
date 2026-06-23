import { registerActiveChatChangeHandler } from '@/entities/chat/model/active-chat-effects'
import { useChatsStore } from '@/entities/chat/model/store'
import { syncPipelineUiForActiveChat } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { getAgentStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'

export function registerActiveChatEffects(): void {
  let prevActiveChatId = useChatsStore.getState().activeChatId

  registerActiveChatChangeHandler(() => {
    const nextActiveChatId = useChatsStore.getState().activeChatId
    const streamChatId = getAgentStreamChatId()
    const leavingBackgroundStream =
      streamChatId != null &&
      prevActiveChatId === streamChatId &&
      nextActiveChatId !== streamChatId

    if (!leavingBackgroundStream) {
      stopTtsPlayback()
    }

    prevActiveChatId = nextActiveChatId
    syncPipelineUiForActiveChat()
  })
}
