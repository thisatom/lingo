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
  /** Flat list only — sticky headers break inside virtualizer translateY rows. */
  userHeaderSticky?: boolean
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

function userAttachmentsSignature(
  attachments: readonly MessageAttachment[] | undefined
): string {
  if (!attachments?.length) return '0'
  return attachments
    .map(
      (attachment) =>
        `${attachment.id}:${attachment.kind}:${attachment.name}:${attachment.sizeBytes}:${attachment.payload.length}:${attachment.payload}`
    )
    .join('|')
}

function searchSourcesSignature(sources: Message['searchSources']): string {
  if (!sources?.length) return ''
  return sources.map((source) => `${source.url}:${source.title}`).join(';')
}

function assistantMessagesSignature(messages: readonly Message[]): string {
  return messages
    .map(
      (message) =>
        `${message.id}:${message.role}:${message.content}:${searchSourcesSignature(message.searchSources)}`
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
  if (prev.turnIndex !== next.turnIndex) return false
  if (prev.userHeaderSticky !== next.userHeaderSticky) return false
  if (prev.turn.user.content !== next.turn.user.content) return false
  if (
    userAttachmentsSignature(prev.turn.user.attachments) !==
    userAttachmentsSignature(next.turn.user.attachments)
  ) {
    return false
  }
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
