import { cn } from '@/shared/lib/utils'
import type { ConversationTurn as Turn } from '@/widgets/conversation-panel/lib/group-turns'
import { AgentMessage } from './AgentMessage'
import { UserMessage } from './UserMessage'

interface ConversationTurnProps {
  turn: Turn
  lastAssistantMessageId: string | null
  editingUserMessageId: string | null
  actionsDisabled?: boolean
  onEnterEdit: (messageId: string) => void
  onExitEdit: () => void
  onSubmitEdit: (messageId: string, text: string) => void
  onRegenerateAssistant: (messageId: string) => void
}

export function ConversationTurn({
  turn,
  lastAssistantMessageId,
  editingUserMessageId,
  actionsDisabled,
  onEnterEdit,
  onExitEdit,
  onSubmitEdit,
  onRegenerateAssistant
}: ConversationTurnProps) {
  const isEditing = editingUserMessageId === turn.user.id

  return (
    <section className="w-full min-w-0 max-w-full space-y-3" data-conversation-turn>
      <div
        className={cn(
          'z-20 w-full min-w-0 max-w-full bg-background',
          isEditing ? 'relative' : 'sticky top-0'
        )}
      >
        <UserMessage
          messageId={turn.user.id}
          content={turn.user.content}
          disabled={actionsDisabled}
          isEditing={isEditing}
          onEnterEdit={() => onEnterEdit(turn.user.id)}
          onExitEdit={onExitEdit}
          onSubmitEdit={(text) => onSubmitEdit(turn.user.id, text)}
        />
      </div>

      {turn.assistantMessages.map((message) => (
        <article key={message.id} className="min-w-0 max-w-full">
          <AgentMessage
            content={message.content}
            messageId={message.id}
            isLatestAssistant={message.id === lastAssistantMessageId}
            disabled={actionsDisabled}
            onRegenerate={() => onRegenerateAssistant(message.id)}
          />
        </article>
      ))}
    </section>
  )
}
