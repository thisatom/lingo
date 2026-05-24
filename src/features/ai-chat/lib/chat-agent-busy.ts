import type { PipelineStage } from '@/entities/conversation/model/store'
import { isAgentStreamActiveForChat } from '@/features/ai-chat/lib/agent-stream-session'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'

export function isAgentPipelineBusy(
  stage: PipelineStage,
  streamActiveForChat: boolean
): boolean {
  return (
    streamActiveForChat ||
    stage === 'thinking' ||
    stage === 'searching' ||
    stage === 'speaking'
  )
}

/** Whether the given chat has an in-flight agent turn (per-chat pipeline + stream). */
export function isChatAgentBusy(chatId: string): boolean {
  const { stage } = getChatPipeline(chatId)
  return isAgentPipelineBusy(stage, isAgentStreamActiveForChat(chatId))
}
