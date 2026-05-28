import type { Message } from '@/entities/message/model/types'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { messageHasVisibleContent } from '@/shared/lib/chat-message-api'

export type ConversationTurn = {
  id: string
  user: Message
  assistantMessages: Message[]
}

export { messageHasVisibleContent }

export function lastAssistantMessageId(messages: readonly Message[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') return messages[i].id
  }
  return undefined
}

export function voiceCaptureLabelForUserMessage(
  userId: string,
  userContent: string,
  liveVoiceUserMessageId: string | null | undefined,
  stage: PipelineStage
): 'listening' | 'transcribing' | null {
  if (liveVoiceUserMessageId !== userId || userContent.trim()) return null
  if (stage === 'transcribing') return 'transcribing'
  return 'listening'
}

/** True while reasoning streams and the final answer for this turn has not started yet. */
export function isThinkingMessageLive(
  turn: Pick<ConversationTurn, 'assistantMessages'>,
  messageId: string,
  agentBusy: boolean,
  isLatestTurn: boolean,
  pipelineStage: PipelineStage = 'idle',
  pipelineStreamingAnswer = false
): boolean {
  const reasoningStage = pipelineStage === 'thinking'

  if (!agentBusy || !isLatestTurn || !reasoningStage) return false

  const index = turn.assistantMessages.findIndex((m) => m.id === messageId)
  if (index === -1 || turn.assistantMessages[index]?.role !== 'thinking') return false

  return !turn.assistantMessages
    .slice(index + 1)
    .some((message) => message.role === 'assistant')
}

/** Hide thinking left over from a stopped turn so it does not sit above the next question. */
export function shouldShowThinkingInTurn(
  turn: Pick<ConversationTurn, 'assistantMessages'>,
  message: Message,
  messageIndex: number,
  options: { agentBusy: boolean; isLatestTurn: boolean }
): boolean {
  if (message.role !== 'thinking') return true

  const hasFollowingAnswer = turn.assistantMessages
    .slice(messageIndex + 1)
    .some((m) => m.role === 'assistant' && m.content.trim().length > 0)

  if (hasFollowingAnswer) return true
  if (options.isLatestTurn && options.agentBusy) return true
  return false
}

export function groupMessagesIntoTurns(
  messages: readonly Message[],
  options?: { preserveEmptyUserMessageId?: string | null }
): ConversationTurn[] {
  const preserveId = options?.preserveEmptyUserMessageId ?? null
  const turns: ConversationTurn[] = []
  let user: Message | null = null
  let assistantMessages: Message[] = []

  const flush = () => {
    if (!user) return

    const visibleAssistants = assistantMessages.filter(messageHasVisibleContent)
    const preserveEmptyUser =
      preserveId != null && user.id === preserveId
    if (
      !messageHasVisibleContent(user) &&
      visibleAssistants.length === 0 &&
      !preserveEmptyUser
    ) {
      user = null
      assistantMessages = []
      return
    }

    turns.push({ id: user.id, user, assistantMessages: visibleAssistants })
    user = null
    assistantMessages = []
  }

  for (const message of messages) {
    if (message.role === 'user') {
      flush()
      user = message
      continue
    }
    if ((message.role === 'assistant' || message.role === 'thinking') && user) {
      assistantMessages.push(message)
    }
  }

  flush()
  return turns
}
