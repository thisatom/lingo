import type { PipelineStage } from '@/entities/conversation/model/store'
import {
  getAgentStreamChatId,
  isAgentStreamActiveForChat
} from '@/features/ai-chat/lib/agent-stream-session'
import {
  isBusyAgentPhase,
  pipelineStageToAgentPhase,
  type AgentTurnPhase
} from '@/features/ai-chat/lib/chat-agent-transitions'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'
import { getAgentRunGeneration } from '@/features/ai-chat/model/agent-run'

/** Single read model for agent busy / phase (per chat or active view). */
export type AgentSessionSnapshot = {
  chatId: string | null
  runId: number
  phase: AgentTurnPhase
  streamActive: boolean
}

export function getAgentSessionSnapshot(chatId: string): AgentSessionSnapshot {
  const { stage } = getChatPipeline(chatId)
  return {
    chatId,
    runId: getAgentRunGeneration(),
    phase: pipelineStageToAgentPhase(stage),
    streamActive: isAgentStreamActiveForChat(chatId)
  }
}

/** Snapshot when there is no active chat id (global conversation mirror). */
export function getAgentSessionSnapshotForView(
  activeChatId: string | null,
  viewStage: PipelineStage
): AgentSessionSnapshot {
  if (activeChatId) {
    return getAgentSessionSnapshot(activeChatId)
  }
  const streamChatId = getAgentStreamChatId()
  return {
    chatId: streamChatId,
    runId: getAgentRunGeneration(),
    phase: pipelineStageToAgentPhase(viewStage),
    streamActive: streamChatId != null
  }
}

export function isAgentSessionBusy(snapshot: AgentSessionSnapshot): boolean {
  if (snapshot.streamActive) return true
  // TTS playback uses `speaking` stage for status UI only — turn is done for send/stop busy state.
  if (snapshot.phase === 'speaking') return false
  return isBusyAgentPhase(snapshot.phase)
}
