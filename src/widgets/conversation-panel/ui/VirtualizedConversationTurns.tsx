import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createRafCoalescer } from '@/shared/lib/raf-coalesce'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { PipelineStage } from '@/entities/conversation/model/store'
import type { SubmitEditedUserMessageResult } from '@/features/ai-chat/model/submit-edited-user-message'
import type { EditSpeechTarget } from '@/widgets/conversation-panel/lib/edit-speech-target'
import { estimateTurnHeightPx } from '@/widgets/conversation-panel/lib/estimate-turn-height'
import {
  lastAssistantMessageId,
  type ConversationTurn as Turn,
  voiceCaptureLabelForUserMessage
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
  pipelineSearchActiveUrl?: string | null
  /** Live thinking in thread only when pipeline is in `thinking`. */
  stage: PipelineStage
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
  liveVoiceUserMessageId?: string | null
  /** Called after the tail turn height changes during an active agent reply. */
  onTailContentChange?: () => void
}

export function VirtualizedConversationTurns({
  turns,
  scrollElement,
  activeChatId,
  editingUserMessageId,
  actionsDisabled,
  agentBusy,
  pipelineStreamingAnswer = false,
  pipelineSearchActiveUrl = null,
  stage,
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
  liveVoiceUserMessageId = null,
  onTailContentChange
}: VirtualizedConversationTurnsProps) {
  const tailCoalescerRef = useRef(createRafCoalescer(() => onTailContentChange?.()))

  useEffect(() => {
    tailCoalescerRef.current.cancel()
    tailCoalescerRef.current = createRafCoalescer(() => onTailContentChange?.())
    return () => tailCoalescerRef.current.cancel()
  }, [onTailContentChange])

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
    tailCoalescerRef.current.schedule()
  }, [agentBusy, turns.length, tailAssistantLen, tailThinkingLen])

  useEffect(() => {
    if (!scrollElement) return
    virtualizer.measure()
  }, [scrollElement, turns.length, virtualizer])

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
              liveVoiceUserMessageId={liveVoiceUserMessageId}
              voiceCaptureLabel={voiceCaptureLabelForUserMessage(
                turn.user.id,
                turn.user.content,
                liveVoiceUserMessageId,
                stage
              )}
              agentBusy={agentBusy}
              isLatestTurn={isLatestTurn}
              pipelineStage={isLatestTurn ? stage : 'idle'}
              pipelineStreamingAnswer={
                agentBusy && isLatestTurn ? pipelineStreamingAnswer : false
              }
              pipelineSearchActiveUrl={isLatestTurn ? pipelineSearchActiveUrl : null}
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
