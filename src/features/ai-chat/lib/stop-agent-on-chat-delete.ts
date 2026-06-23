import { getAgentStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import { executeAgentStop } from '@/features/ai-chat/lib/chat-agent-stop'
import {
  buildDefaultAgentStopContext,
  getSharedAgentChatSessionRefs
} from '@/features/ai-chat/model/agent-chat-session'

/** Abort stream/TTS only when the deleted chat owns the in-flight stream. */
export function stopAgentOnChatDeleted(chatId: string): void {
  const streamChatId =
    getSharedAgentChatSessionRefs().streamTargetChatIdRef.current ?? getAgentStreamChatId()
  if (streamChatId !== chatId) {
    return
  }
  executeAgentStop({ chatId, force: true }, buildDefaultAgentStopContext())
}
