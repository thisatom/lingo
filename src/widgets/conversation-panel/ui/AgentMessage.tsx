import type { MessageSearchSource } from '@/entities/message/model/types'
import { cn } from '@/shared/lib/utils'
import { MarkdownContent } from '@/shared/ui/markdown-content'
import { ChatTextContextMenu } from './chat-context-menu/ChatTextContextMenu'
import {
  agentMessageClass,
  agentMessageWrapClass,
  chatNonSelectableClass,
  chatSelectableClass
} from './agent-layout'
import { WebSearchSources } from './WebSearchSources'

interface AgentMessageProps {
  content: string
  searchSources?: MessageSearchSource[]
  showSearchSpinner?: boolean
  parseThrottleMs?: number
  showStreamingCursor?: boolean
}

export function AgentMessage({
  content,
  searchSources,
  showSearchSpinner = false,
  parseThrottleMs,
  showStreamingCursor = false
}: AgentMessageProps) {
  const hasSearchUi = Boolean(searchSources?.length || showSearchSpinner)
  const hasAnswer = content.trim().length > 0

  return (
    <ChatTextContextMenu className={cn(agentMessageWrapClass, chatSelectableClass)}>
      {hasSearchUi ? (
        <div
          className={cn(
            agentMessageClass,
            'pt-0',
            chatNonSelectableClass,
            hasAnswer && 'pb-2'
          )}
        >
          <WebSearchSources sources={searchSources ?? []} loading={showSearchSpinner} />
        </div>
      ) : null}
      {hasAnswer ? (
        <MarkdownContent
          content={content}
          variant="typography"
          parseThrottleMs={parseThrottleMs}
          showStreamingCursor={showStreamingCursor}
          className={cn(agentMessageClass, chatSelectableClass, hasSearchUi && 'pt-0')}
        />
      ) : null}
    </ChatTextContextMenu>
  )
}
