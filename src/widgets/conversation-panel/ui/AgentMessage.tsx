import { cn } from '@/shared/lib/utils'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import { agentMessageClass, agentMessageWrapClass, chatSelectableClass } from './agent-layout'

interface AgentMessageProps {
  content: string
  messageId: string
}

export function AgentMessage({ content }: AgentMessageProps) {
  return (
    <ChatTextContextMenu className={cn(agentMessageWrapClass, chatSelectableClass)}>
      <MarkdownContent
        content={content}
        variant="typography"
        className={cn(agentMessageClass, chatSelectableClass)}
      />
    </ChatTextContextMenu>
  )
}
