import { registerActiveChatChangeHandler } from '@/entities/chat/model/active-chat-effects'
import { syncPipelineUiForActiveChat } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { stopTtsPlayback } from '@/features/text-to-speech/model/playTts'

export function registerActiveChatEffects(): void {
  registerActiveChatChangeHandler(() => {
    stopTtsPlayback()
    syncPipelineUiForActiveChat()
  })
}
