import { memo } from 'react'
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
import { AgentMessageActions } from './AgentMessageActions'

interface AgentMessageProps {
  content: string
  searchSources?: MessageSearchSource[]
  showSearchSpinner?: boolean
  parseThrottleMs?: number
  showFooterActions?: boolean
  onRegenerate?: () => void
  regenerateDisabled?: boolean
}

export const AgentMessage = memo(function AgentMessage({
  content,
  searchSources,
  showSearchSpinner = false,
  parseThrottleMs,
  showFooterActions = false,
  onRegenerate,
  regenerateDisabled = false
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
          className={cn(agentMessageClass, chatSelectableClass, hasSearchUi && 'pt-0')}
        />
      ) : null}
      {showFooterActions && hasAnswer ? (
        <AgentMessageActions
          content={content}
          onRegenerate={onRegenerate}
          regenerateDisabled={regenerateDisabled}
        />
      ) : null}
    </ChatTextContextMenu>
  )
})
