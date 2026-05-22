import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { cn } from '@/shared/lib/utils'
import type { ConversationTurn as Turn } from '@/widgets/conversation-panel/lib/group-turns'
import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'

interface ConversationTurnProps {
  turn: Turn
  /** Stack order when multiple question headers stick (later turns on top). */
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
  ) => void | Promise<void>
  onAttachmentError?: (message: string) => void
}

export function ConversationTurn({
  turn,
  turnIndex,
  activeChatId,
  editingUserMessageId,
  actionsDisabled,
  showStopOnUserMessage,
  onStopAgent,
  voiceSupported,
  voiceBusy,
  isVoiceListening,
  onVoicePress,
  onVoiceStop,
  onRegisterEditSpeech,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit,
  onAttachmentError
}: ConversationTurnProps) {
  const isEditing = editingUserMessageId === turn.user.id

  return (
    <section
      className="w-full min-w-0 max-w-full scroll-mt-[18px] space-y-3.5"
      data-conversation-turn
      data-turn-id={turn.user.id}
    >
      <div
        className={cn(
          'w-full min-w-0 max-w-full bg-background',
          isEditing ? 'relative' : 'sticky top-0 pb-px'
        )}
        style={isEditing ? undefined : { zIndex: turnIndex }}
      >
        <UserMessage
          messageId={turn.user.id}
          content={turn.user.content}
          attachments={turn.user.attachments}
          chatId={activeChatId}
          disabled={actionsDisabled && !showStopOnUserMessage}
          isEditing={isEditing}
          showStop={showStopOnUserMessage}
          onStopAgent={onStopAgent}
          voiceSupported={voiceSupported}
          voiceBusy={voiceBusy}
          isVoiceListening={isVoiceListening}
          onVoicePress={onVoicePress}
          onVoiceStop={onVoiceStop}
          onRegisterEditSpeech={isEditing ? onRegisterEditSpeech : undefined}
          onEnterEdit={() => onEnterEdit(turn.user.id)}
          onExitEdit={onExitEdit}
          onSubmitEdit={(text, attachments) =>
            onSubmitEdit(turn.user.id, text, attachments)
          }
          onAttachmentError={onAttachmentError}
        />
      </div>

      {turn.assistantMessages.map((message) => (
        <article key={message.id} className="mt-1.5 min-w-0 max-w-full">
          <AgentMessage content={message.content} messageId={message.id} />
        </article>
      ))}
    </section>
  )
}
