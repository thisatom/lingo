import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollArea } from '@/shared/ui/scroll-area'
import type { Message } from '@/entities/message/model/types'
import type { PipelineStage } from '@/entities/conversation/model/store'
import { AgentMessage } from './AgentMessage'
import { AgentStatus } from './AgentStatus'
import { UserMessage } from './UserMessage'

const ACTIVE_STAGES: PipelineStage[] = [
  'listening',
  'transcribing',
  'thinking',
  'searching',
  'speaking'
]

/** Space for floating composer, optional error banner, and bottom shadow */
const CHAT_BOTTOM_INSET = '7rem'

interface ConversationPanelProps {
  messages: Message[]
  stage: PipelineStage
  activeChatId: string | null
  actionsDisabled?: boolean
  onSubmitEditedUserMessage: (messageId: string, text: string) => void
  onRegenerateAssistantMessage: (messageId: string) => void
}

export function ConversationPanel({
  messages,
  stage,
  activeChatId,
  actionsDisabled,
  onSubmitEditedUserMessage,
  onRegenerateAssistantMessage
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(null)
  const showStatus = ACTIVE_STAGES.includes(stage)

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

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, stage, showStatus])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScrollArea className="h-full min-h-0">
        <div
          className="mx-auto max-w-3xl space-y-[18px] px-4 pt-[18px] sm:px-6"
          style={{ paddingBottom: `calc(${CHAT_BOTTOM_INSET} + 18px)` }}
        >
          {messages.length === 0 && !showStatus && (
            <p className="pb-1 text-sm text-muted-foreground">
              Hold the mic and speak, or type a message below to start practicing.
            </p>
          )}

          {messages.map((m) => (
            <article key={m.id}>
              {m.role === 'user' ? (
                <UserMessage
                  messageId={m.id}
                  content={m.content}
                  disabled={actionsDisabled}
                  isEditing={editingUserMessageId === m.id}
                  onEnterEdit={() => setEditingUserMessageId(m.id)}
                  onExitEdit={() => setEditingUserMessageId(null)}
                  onSubmitEdit={(text) => {
                    void onSubmitEditedUserMessage(m.id, text)
                  }}
                />
              ) : (
                <AgentMessage
                  content={m.content}
                  messageId={m.id}
                  isLatestAssistant={m.id === lastAssistantMessageId}
                  disabled={actionsDisabled}
                  onRegenerate={() => onRegenerateAssistantMessage(m.id)}
                />
              )}
            </article>
          ))}

          {showStatus && <AgentStatus stage={stage} />}

          <div ref={bottomRef} className="h-px shrink-0" />
        </div>
      </ScrollArea>
    </div>
  )
}
