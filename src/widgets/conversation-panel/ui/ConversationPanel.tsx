import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgentChatScrollArea } from './AgentChatScrollArea'
import type { MessageAttachment } from '@/entities/message/model/attachment'
import type { Message } from '@/entities/message/model/types'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { CHAT_COLUMN_MAX_WIDTH_CLASS } from '@/shared/lib/layout'
import { CHAT_BOTTOM_INSET } from '@/widgets/conversation-panel/lib/chat-layout'
import {
  groupMessagesIntoTurns,
  messageHasVisibleContent
} from '@/widgets/conversation-panel/lib/group-turns'
import { cn } from '@/shared/lib/utils'
import { agentContentIndentClass } from './agent-layout'
import { AgentStatus } from './AgentStatus'
import { ChatEmptyPrompt } from './ChatEmptyPrompt'
import { ConversationTurn } from './ConversationTurn'

const ACTIVE_STAGES: PipelineStage[] = [
  'listening',
  'transcribing',
  'thinking',
  'searching',
  'speaking'
]

interface ConversationPanelProps {
  messages: readonly Message[]
  stage: PipelineStage
  activeChatId: string | null
  actionsDisabled?: boolean
  onSubmitEditedUserMessage: (
    messageId: string,
    text: string,
    attachments?: MessageAttachment[]
  ) => void
  onAtBottomChange?: (atBottom: boolean) => void
  onShowScrollToLatestChange?: (show: boolean) => void
  onScrollToLatestReady?: (scrollToLatest: () => void) => void
}

export function ConversationPanel({
  messages,
  stage,
  activeChatId,
  actionsDisabled,
  onSubmitEditedUserMessage,
  onAtBottomChange,
  onShowScrollToLatestChange,
  onScrollToLatestReady
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const showStatus = ACTIVE_STAGES.includes(stage)

  const scrollToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleAtBottomChange = useCallback(
    (value: boolean) => {
      setAtBottom(value)
      onAtBottomChange?.(value)
    },
    [onAtBottomChange]
  )

  useEffect(() => {
    onScrollToLatestReady?.(scrollToLatest)
  }, [onScrollToLatestReady, scrollToLatest])

  useEffect(() => {
    setEditingUserMessageId(null)
  }, [activeChatId])

  useEffect(() => {
    if (!editingUserMessageId) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (target instanceof Element && target.closest('[data-user-message-edit]')) return
      setEditingUserMessageId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [editingUserMessageId])

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])
  const hasVisibleMessages = useMemo(
    () => messages.some(messageHasVisibleContent),
    [messages]
  )

  useEffect(() => {
    if (!atBottom) return
    scrollToLatest()
  }, [messages, stage, showStatus, atBottom, scrollToLatest])

  const showEmptyPrompt = !hasVisibleMessages && !showStatus

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showEmptyPrompt ? (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4">
          <ChatEmptyPrompt className="w-full max-w-md" />
        </div>
      ) : null}

      <AgentChatScrollArea
        className="h-full min-h-0"
        onAtBottomChange={handleAtBottomChange}
        onShowScrollToLatestChange={onShowScrollToLatestChange}
      >
        <div
          className={cn(
            'mx-auto min-h-full px-4 pt-[18px] sm:px-6',
            CHAT_COLUMN_MAX_WIDTH_CLASS
          )}
        >
          <div
            className={cn('relative min-h-full', turns.length > 0 && 'space-y-5')}
            style={{ paddingBottom: `calc(${CHAT_BOTTOM_INSET} + 18px)` }}
          >
            {turns.map((turn) => (
              <ConversationTurn
                key={turn.id}
                turn={turn}
                activeChatId={activeChatId}
                editingUserMessageId={editingUserMessageId}
                actionsDisabled={actionsDisabled}
                onEnterEdit={setEditingUserMessageId}
                onExitEdit={() => setEditingUserMessageId(null)}
                onSubmitEdit={(messageId, text, attachments) => {
                  void onSubmitEditedUserMessage(messageId, text, attachments)
                }}
              />
            ))}

            {showStatus ? (
              <div className={agentContentIndentClass}>
                <AgentStatus stage={stage} />
              </div>
            ) : null}

            <div ref={bottomRef} className="h-px shrink-0" />
          </div>
        </div>
      </AgentChatScrollArea>
    </div>
  )
}
