import type { MessageSearchSource } from '@/entities/message/model/types'
import { cn } from '@/shared/lib/utils'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import { agentMessageClass, agentMessageWrapClass, chatSelectableClass } from './agent-layout'
import { WebSearchSources } from './WebSearchSources'

interface AgentMessageProps {
  content: string
  searchSources?: MessageSearchSource[]
  parseThrottleMs?: number
}

export function AgentMessage({ content, searchSources, parseThrottleMs }: AgentMessageProps) {
  return (
    <ChatTextContextMenu className={cn(agentMessageWrapClass, chatSelectableClass)}>
      <MarkdownContent
        content={content}
        variant="typography"
        parseThrottleMs={parseThrottleMs}
        className={cn(agentMessageClass, chatSelectableClass)}
      />
      {searchSources?.length ? (
        <div className={cn(agentMessageClass, 'pt-0')}>
          <WebSearchSources sources={searchSources} />
        </div>
      ) : null}
    </ChatTextContextMenu>
  )
}
