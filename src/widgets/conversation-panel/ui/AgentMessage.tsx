import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import { agentMessageClass, agentMessageWrapClass } from './agent-layout'

interface AgentMessageProps {
  content: string
  messageId: string
}

export function AgentMessage({ content }: AgentMessageProps) {
  return (
    <ChatTextContextMenu className={agentMessageWrapClass}>
      <MarkdownContent
        content={content}
        variant="typography"
        className={agentMessageClass}
      />
    </ChatTextContextMenu>
  )
}
