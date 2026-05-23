import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { estimateTurnHeightPx } from '@/widgets/conversation-panel/lib/estimate-turn-height'
import {
  lastAssistantMessageId,
  type ConversationTurn as Turn
} from '@/widgets/conversation-panel/lib/group-turns'
import { ConversationTurn } from './ConversationTurn'

export const VIRTUALIZE_MESSAGE_THRESHOLD = 100

type VirtualizedConversationTurnsProps = {
  turns: Turn[]
  scrollElement: HTMLElement | null
  activeChatId: string | null
  editingUserMessageId: string | null
  actionsDisabled?: boolean
  agentBusy?: boolean
  pipelineStreamingAnswer?: boolean
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
  pipelineStreamingAnswer = false,
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
    estimateSize: (index) => estimateTurnHeightPx(turns[index]!),
    overscan: 3
  })

  const tailTurn = turns[turns.length - 1]
  const tailAssistantId = tailTurn ? lastAssistantMessageId(tailTurn.assistantMessages) : undefined
  const tailAssistantLen =
    tailTurn?.assistantMessages.find((m) => m.id === tailAssistantId)?.content.length ?? 0
  const tailThinkingLen =
    tailTurn?.assistantMessages.find((m) => m.role === 'thinking')?.content.length ?? 0

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
  }, [agentBusy, turns.length, tailAssistantLen, tailThinkingLen, virtualizer])

  const items = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  useEffect(() => {
    if (!scrollElement) return
    virtualizer.measure()
  }, [scrollElement, totalSize, turns.length, virtualizer])

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
              agentBusy={agentBusy}
              isLatestTurn={isLatestTurn}
              streamingAssistantMessageId={
                agentBusy && isLatestTurn && pipelineStreamingAnswer
                  ? lastAssistantMessageId(turn.assistantMessages)
                  : undefined
              }
            />
          </div>
        )
      })}
    </div>
  )
}
