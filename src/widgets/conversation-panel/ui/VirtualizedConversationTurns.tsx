import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import type { ConversationTurn as Turn } from '@/widgets/conversation-panel/lib/group-turns'
import { ConversationTurn } from './ConversationTurn'

const ESTIMATED_TURN_HEIGHT_PX = 140

export const VIRTUALIZE_MESSAGE_THRESHOLD = 100

type VirtualizedConversationTurnsProps = {
  turns: Turn[]
  scrollElement: HTMLElement | null
  activeChatId: string | null
  editingUserMessageId: string | null
  actionsDisabled?: boolean
  agentBusy?: boolean
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
}

export function VirtualizedConversationTurns({
  turns,
  scrollElement,
  activeChatId,
  editingUserMessageId,
  actionsDisabled,
  agentBusy,
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
}: VirtualizedConversationTurnsProps) {
  const measureRafRef = useRef<number | null>(null)

  const virtualizer = useVirtualizer({
    count: turns.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ESTIMATED_TURN_HEIGHT_PX,
    overscan: 3
  })

  const tailAssistantLen =
    turns[turns.length - 1]?.assistantMessages.at(-1)?.content.length ?? 0

  useEffect(() => {
    if (!agentBusy) return
    if (measureRafRef.current != null) cancelAnimationFrame(measureRafRef.current)
    measureRafRef.current = requestAnimationFrame(() => {
      measureRafRef.current = null
      virtualizer.measure()
    })
    return () => {
      if (measureRafRef.current != null) cancelAnimationFrame(measureRafRef.current)
    }
  }, [agentBusy, turns.length, tailAssistantLen, virtualizer])

  const items = virtualizer.getVirtualItems()

  return (
    <div
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {items.map((virtualRow) => {
        const turn = turns[virtualRow.index]
        const isLatestTurn = virtualRow.index === turns.length - 1
        const showStopOnUserMessage = Boolean(agentBusy && isLatestTurn)

        return (
          <div
            key={turn.id}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <ConversationTurn
              turn={turn}
              turnIndex={virtualRow.index + 1}
              activeChatId={activeChatId}
              editingUserMessageId={editingUserMessageId}
              actionsDisabled={actionsDisabled}
              showStopOnUserMessage={showStopOnUserMessage}
              onStopAgent={onStopAgent}
              voiceSupported={voiceSupported}
              voiceBusy={voiceBusy}
              isVoiceListening={isVoiceListening}
              onVoicePress={onVoicePress}
              onVoiceStop={onVoiceStop}
              onRegisterEditSpeech={onRegisterEditSpeech}
              onEnterEdit={onEnterEdit}
              onExitEdit={onExitEdit}
              onSubmitEdit={onSubmitEdit}
              onAttachmentError={onAttachmentError}
              streamingAssistantMessageId={
                agentBusy && isLatestTurn
                  ? turn.assistantMessages[turn.assistantMessages.length - 1]?.id
                  : undefined
              }
            />
          </div>
        )
      })}
    </div>
  )
}
