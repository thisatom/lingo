import { getAgentStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import { executeAgentStop } from '@/features/ai-chat/lib/chat-agent-stop'
import {
  buildDefaultAgentStopContext,
  getSharedAgentChatSessionRefs
} from '@/features/ai-chat/model/agent-chat-session'

export type StopAgentOnChatDeletedOptions = {
  pipelineBusy?: boolean
  pendingReply?: boolean
}

/** Abort stream/TTS when a deleted chat still has in-flight agent work. */
export function stopAgentOnChatDeleted(
  chatId: string,
  options: StopAgentOnChatDeletedOptions = {}
): void {
  const streamChatId =
    getSharedAgentChatSessionRefs().streamTargetChatIdRef.current ?? getAgentStreamChatId()
  const { pipelineBusy = false, pendingReply = false } = options
  if (streamChatId !== chatId && !pipelineBusy && !pendingReply) {
    return
  }
  executeAgentStop({ chatId, force: true }, buildDefaultAgentStopContext())
}
