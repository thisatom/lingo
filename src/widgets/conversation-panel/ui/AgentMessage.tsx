import { memo } from 'react'
import type { MessageSearchSource } from '@/entities/message/model/types'
import { useReplyTranslation } from '@/features/message-translate/lib/use-reply-translation'
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
  const {
    displayContent,
    isShowingTranslation,
    loading: translateLoading,
    error: translateError,
    toggle: toggleTranslation,
    fromLang,
    toLang,
    updateFromLang,
    updateToLang
  } = useReplyTranslation(content)

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
        <>
          {isShowingTranslation ? (
            <p
              className={cn(
                agentMessageClass,
                'pb-0 text-[11px] font-medium text-muted-foreground',
                chatNonSelectableClass
              )}
            >
              Translation
            </p>
          ) : null}
          <MarkdownContent
            content={displayContent}
            variant="typography"
            parseThrottleMs={isShowingTranslation ? undefined : parseThrottleMs}
            className={cn(
              agentMessageClass,
              chatSelectableClass,
              hasSearchUi && 'pt-0',
              isShowingTranslation && 'pt-1'
            )}
          />
        </>
      ) : null}
      {translateError ? (
        <p className={cn(agentMessageClass, 'pt-0 text-[11px] text-destructive')}>
          {translateError}
        </p>
      ) : null}
      {showFooterActions && hasAnswer ? (
        <AgentMessageActions
          content={displayContent}
          isShowingTranslation={isShowingTranslation}
          translateLoading={translateLoading}
          fromLang={fromLang}
          toLang={toLang}
          onToggleTranslation={toggleTranslation}
          onFromLangChange={updateFromLang}
          onToLangChange={updateToLang}
          onRegenerate={onRegenerate}
          regenerateDisabled={regenerateDisabled}
        />
      ) : null}
    </ChatTextContextMenu>
  )
})
