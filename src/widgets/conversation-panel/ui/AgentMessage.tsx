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
    <div className="group/message space-y-1">
      <MarkdownContent content={content} className={agentMessageClass} />
      <AgentMessageActions
        content={content}
        disabled={disabled}
        onRegenerate={onRegenerate}
      />
    </div>
  )
}
