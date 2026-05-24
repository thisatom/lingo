import { getAgentStreamChatId } from '@/features/ai-chat/lib/agent-stream-session'
import { isChatAgentBusy } from '@/features/ai-chat/lib/chat-agent-busy'

export const OTHER_CHAT_STREAM_MESSAGE =
  'Another chat is still responding. Open that chat to follow progress, or stop it there before sending here.'

/** Active stream in a different chat — blocks starting a new turn here. */
export function getOtherChatStreamBlocking(targetChatId: string): string | null {
  const streamingId = getAgentStreamChatId()
  if (!streamingId || streamingId === targetChatId) return null
  return streamingId
}

/** Queue or block user input while this chat or another chat has an in-flight agent turn. */
export function shouldDeferChatAgentTurn(chatId: string): boolean {
  return isChatAgentBusy(chatId) || getOtherChatStreamBlocking(chatId) != null
}
