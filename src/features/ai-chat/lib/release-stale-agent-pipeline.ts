import type { PipelineStage } from '@/entities/conversation/model/store'
import { isAgentStreamActiveForChat } from '@/features/ai-chat/lib/agent-stream-session'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'

const STALE_AGENT_STAGES: PipelineStage[] = ['thinking', 'searching', 'speaking']

/** Clears a stuck per-chat pipeline when this turn was superseded but never reached `finishAgentTurnForChat`. */
export function releaseStaleAgentPipelineStage(chatId: string): void {
  if (isAgentStreamActiveForChat(chatId)) return
  const { stage } = getChatPipeline(chatId)
  if (STALE_AGENT_STAGES.includes(stage)) {
    setPipelineStageForChat(chatId, 'idle')
  }
}
