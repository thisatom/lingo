import { MarkdownContent } from '@/shared/ui/markdown-content'
import { AgentMessageActions } from './MessageActions'
import { agentMessageClass } from './agent-layout'

interface AgentMessageProps {
  content: string
  messageId: string
  isLatestAssistant: boolean
  disabled?: boolean
  onRegenerate: () => void
}

export function AgentMessage({ content, disabled, onRegenerate }: AgentMessageProps) {
  return (
    <div className="group/message w-full min-w-0 max-w-full space-y-1 overflow-hidden">
      <MarkdownContent
        content={content}
        variant="typography"
        className={agentMessageClass}
      />
      <AgentMessageActions
        className="pl-3"
        content={content}
        disabled={disabled}
        onRegenerate={onRegenerate}
      />
    </div>
  )
}
