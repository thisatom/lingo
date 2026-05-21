import type { MessageAttachment } from '@/entities/message/model/attachment'
import { cn } from '@/shared/lib/utils'
import type { ConversationTurn as Turn } from '@/widgets/conversation-panel/lib/group-turns'
import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'

interface ConversationTurnProps {
  turn: Turn
  activeChatId: string | null
  editingUserMessageId: string | null
  actionsDisabled?: boolean
  onEnterEdit: (messageId: string) => void
  onExitEdit: () => void
  onSubmitEdit: (messageId: string, text: string, attachments?: MessageAttachment[]) => void
  onAttachmentError?: (message: string) => void
}

export function ConversationTurn({
  turn,
  activeChatId,
  editingUserMessageId,
  actionsDisabled,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit,
  onAttachmentError
}: ConversationTurnProps) {
  const isEditing = editingUserMessageId === turn.user.id

  return (
    <section
      className="w-full min-w-0 max-w-full space-y-3.5"
      data-conversation-turn
      data-turn-id={turn.user.id}
    >
      <div
        className={cn(
          'z-20 w-full min-w-0 max-w-full bg-background',
          isEditing ? 'relative' : 'sticky top-0'
        )}
      >
        <UserMessage
          messageId={turn.user.id}
          content={turn.user.content}
          attachments={turn.user.attachments}
          chatId={activeChatId}
          disabled={actionsDisabled}
          isEditing={isEditing}
          onEnterEdit={() => onEnterEdit(turn.user.id)}
          onExitEdit={onExitEdit}
          onSubmitEdit={(text, attachments) => onSubmitEdit(turn.user.id, text, attachments)}
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
