import { useEffect, useRef } from 'react'
import type { Message } from '@/entities/message/model/types'
import { getThinkingDurationMs } from '@/widgets/conversation-panel/lib/thought-duration'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import { ThinkingBlock } from './ThinkingBlock'
import { agentMessageWrapClass, chatSelectableClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'

interface AgentThinkingMessageProps {
  message: Pick<Message, 'id' | 'content' | 'createdAt'>
  assistantMessages: readonly Message[]
  live?: boolean
}

/** Persisted or live model reasoning — separate from the assistant answer. */
export function AgentThinkingMessage({
  message,
  assistantMessages,
  live = false
}: AgentThinkingMessageProps) {
  const streamEndedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (live) {
      streamEndedAtRef.current = null
      return
    }
    if (streamEndedAtRef.current == null) {
      streamEndedAtRef.current = Date.now()
    }
  }, [live])

  const thoughtDurationMs = live
    ? undefined
    : getThinkingDurationMs(
        message,
        assistantMessages,
        streamEndedAtRef.current ?? undefined
      )

  return (
    <ChatTextContextMenu className={cn(agentMessageWrapClass, chatSelectableClass)}>
      <ThinkingBlock
        content={message.content}
        live={live}
        thoughtDurationMs={thoughtDurationMs}
      />
    </ChatTextContextMenu>
  )
}
