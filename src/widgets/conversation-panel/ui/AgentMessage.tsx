import { cn } from '@/shared/lib/utils'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import { agentMessageClass, agentMessageWrapClass, chatSelectableClass } from './agent-layout'

interface AgentMessageProps {
  content: string
  parseThrottleMs?: number
}

export function AgentMessage({ content, parseThrottleMs }: AgentMessageProps) {
  return (
    <ChatTextContextMenu className={cn(agentMessageWrapClass, chatSelectableClass)}>
      <MarkdownContent
        content={content}
        variant="typography"
        parseThrottleMs={parseThrottleMs}
        className={cn(agentMessageClass, chatSelectableClass)}
      />
    </ChatTextContextMenu>
  )
}
