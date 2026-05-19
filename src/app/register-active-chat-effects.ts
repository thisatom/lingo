import { registerActiveChatChangeHandler } from '@/entities/chat/model/active-chat-effects'
import { useConversationStore } from '@/entities/conversation/model/store'
import { cancelAgentRun } from '@/features/ai-chat/model/agent-run'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'

export function registerActiveChatEffects(): void {
  registerActiveChatChangeHandler(() => {
    cancelAgentRun()
    stopTtsPlayback()
    useConversationStore.getState().resetPipeline()
  })
}
