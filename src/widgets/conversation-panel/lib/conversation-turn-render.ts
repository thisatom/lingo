import type { Message } from '@/entities/message/model/types'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { PipelineStage } from '@/entities/conversation/model/store'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import type { ConversationTurn as Turn } from '@/widgets/conversation-panel/lib/group-turns'

export type ConversationTurnRenderProps = {
  turn: Turn
  turnIndex: number
  activeChatId: string | null
  editingUserMessageId: string | null
  actionsDisabled?: boolean
  showStopOnUserMessage?: boolean
  onStopAgent?: () => void
  voiceSupported?: boolean
  voiceBusy?: boolean
  isVoiceListening?: boolean
  onVoicePress?: () => void
  onVoiceStop?: () => void
  onRegisterEditSpeech?: (target: EditSpeechTarget | null) => void
  onEnterEdit: (messageId: string) => void
  onExitEdit: () => void
  onSubmitEdit: (
    messageId: string,
    text: string,
    attachments?: MessageAttachment[]
  ) => Promise<SubmitEditedUserMessageResult>
  onAttachmentError?: (message: string) => void
  streamingAssistantMessageId?: string
  agentBusy?: boolean
  isLatestTurn?: boolean
  pipelineStage?: PipelineStage
  pipelineStreamingAnswer?: boolean
  pipelineSearchActiveUrl?: string | null
  liveVoiceUserMessageId?: string | null
  voiceCaptureLabel?: 'listening' | 'transcribing' | null
}

function assistantMessagesSignature(messages: readonly Message[]): string {
  return messages
    .map(
      (message) =>
        `${message.id}:${message.role}:${message.content.length}:${message.searchSources?.length ?? 0}`
    )
    .join('|')
}

/** Skip re-render for completed turns while the tail streams. */
export function areConversationTurnPropsEqual(
  prev: ConversationTurnRenderProps,
  next: ConversationTurnRenderProps
): boolean {
  if (prev.isLatestTurn || next.isLatestTurn) return false
  if (prev.editingUserMessageId === prev.turn.user.id) return false
  if (next.editingUserMessageId === next.turn.user.id) return false
  if (prev.turn.id !== next.turn.id) return false
  if (prev.turn.user.content !== next.turn.user.content) return false
  if (prev.turn.user.attachments?.length !== next.turn.user.attachments?.length) return false
  if (prev.editingUserMessageId !== next.editingUserMessageId) return false
  if (prev.actionsDisabled !== next.actionsDisabled) return false
  if (prev.activeChatId !== next.activeChatId) return false
  if (prev.voiceCaptureLabel !== next.voiceCaptureLabel) return false
  if (
    assistantMessagesSignature(prev.turn.assistantMessages) !==
    assistantMessagesSignature(next.turn.assistantMessages)
  ) {
    return false
  }
  return true
}
