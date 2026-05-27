import type { PipelineStage } from '@/entities/conversation/model/store'
import {
  getAgentSessionSnapshot,
  getAgentSessionSnapshotForView,
  isAgentSessionBusy
} from '@/features/ai-chat/lib/agent-session-snapshot'
import { isAgentStreamActiveForChat } from '@/features/ai-chat/lib/agent-stream-session'
import { isBusyPipelineStage } from '@/features/ai-chat/lib/chat-agent-transitions'
import { getChatPipeline } from '@/features/ai-chat/lib/chat-pipeline-registry'

/** @deprecated Prefer `isAgentSessionBusy(getAgentSessionSnapshotForView(...))`. */
export function isAgentPipelineBusy(
  stage: PipelineStage,
  streamActiveForChat: boolean
): boolean {
  return streamActiveForChat || isBusyPipelineStage(stage)
}

/** Whether the given chat has an in-flight agent turn (per-chat pipeline + stream). */
export function isChatAgentBusy(chatId: string): boolean {
  return isAgentSessionBusy(getAgentSessionSnapshot(chatId))
}

/** Busy check for the chat currently shown in the conversation panel. */
export function isViewingChatAgentBusy(
  activeChatId: string | null,
  viewStage: PipelineStage
): boolean {
  return isAgentSessionBusy(getAgentSessionSnapshotForView(activeChatId, viewStage))
}

/** Stream-only busy (legacy helper for tests). */
export function isChatStreamActive(chatId: string): boolean {
  return isAgentStreamActiveForChat(chatId)
}

/** Raw pipeline stage busy without stream session. */
export function isChatPipelineStageBusy(chatId: string): boolean {
  const { stage } = getChatPipeline(chatId)
  return isBusyPipelineStage(stage)
}
