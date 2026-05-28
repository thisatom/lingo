import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { PipelineStage } from '@/entities/conversation/model/store'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { cn } from '@/shared/lib/utils'
import {
  isThinkingMessageLive,
  shouldShowThinkingInTurn,
  type ConversationTurn as Turn
} from '@/widgets/conversation-panel/lib/group-turns'
import { AgentMessage } from './AgentMessage'
import { AgentThinkingMessage } from './AgentThinkingMessage'
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
  ) => Promise<SubmitEditedUserMessageResult>
  onAttachmentError?: (message: string) => void
  /** Last assistant answer id when streaming — throttles markdown parse. */
  streamingAssistantMessageId?: string
  agentBusy?: boolean
  isLatestTurn?: boolean
  /** Active pipeline stage for the latest turn only (gates live thinking UI). */
  pipelineStage?: PipelineStage
  pipelineStreamingAnswer?: boolean
  liveVoiceUserMessageId?: string | null
  voiceCaptureLabel?: 'listening' | 'transcribing' | null
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
  onAttachmentError,
  streamingAssistantMessageId,
  agentBusy = false,
  isLatestTurn = false,
  pipelineStage = 'idle',
  pipelineStreamingAnswer = false,
  voiceCaptureLabel = null
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
        style={isEditing ? undefined : { zIndex: 20 + turnIndex }}
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
          voiceCaptureLabel={voiceCaptureLabel}
        />
      </div>

      {turn.assistantMessages.map((message, messageIndex) => {
        const isAnswerStream = message.id === streamingAssistantMessageId
        const thinkingLive = isThinkingMessageLive(
          turn,
          message.id,
          agentBusy,
          isLatestTurn,
          isLatestTurn ? pipelineStage : 'idle',
          isLatestTurn ? pipelineStreamingAnswer : false
        )

        if (
          message.role === 'thinking' &&
          !shouldShowThinkingInTurn(turn, message, messageIndex, {
            agentBusy,
            isLatestTurn
          })
        ) {
          return null
        }

        if (message.role === 'thinking' && !message.content.trim() && !thinkingLive) {
          return null
        }

        return (
          <article key={message.id} className="relative z-0 mt-1.5 min-w-0 max-w-full">
            {message.role === 'thinking' ? (
              <AgentThinkingMessage
                message={message}
                assistantMessages={turn.assistantMessages}
                live={thinkingLive}
              />
            ) : (
              <AgentMessage
                content={message.content}
                searchSources={message.searchSources}
                parseThrottleMs={isAnswerStream ? 120 : undefined}
              />
            )}
          </article>
        )
      })}
    </section>
  )
}
