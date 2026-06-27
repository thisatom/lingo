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
  visitingSearchUrl?: string | null
  parseThrottleMs?: number
  showFooterActions?: boolean
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  onContinue?: () => void
  continueDisabled?: boolean
}

export const AgentMessage = memo(function AgentMessage({
  content,
  searchSources,
  showSearchSpinner = false,
  visitingSearchUrl = null,
  parseThrottleMs,
  showFooterActions = false,
  onRegenerate,
  regenerateDisabled = false,
  onContinue,
  continueDisabled = false
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

  const hasSearchUi = Boolean(searchSources?.length || showSearchSpinner || visitingSearchUrl)
  const hasAnswer = content.trim().length > 0
  const showActionBar = showFooterActions || Boolean(onContinue)

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
          <WebSearchSources
            sources={searchSources ?? []}
            loading={showSearchSpinner}
            visitingUrl={visitingSearchUrl}
          />
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
      {showActionBar ? (
        <AgentMessageActions
          content={displayContent}
          isShowingTranslation={isShowingTranslation}
          translateLoading={translateLoading}
          fromLang={fromLang}
          toLang={toLang}
          onToggleTranslation={showFooterActions ? toggleTranslation : undefined}
          onFromLangChange={showFooterActions ? updateFromLang : undefined}
          onToLangChange={showFooterActions ? updateToLang : undefined}
          onRegenerate={showFooterActions ? onRegenerate : undefined}
          regenerateDisabled={regenerateDisabled}
          onContinue={onContinue}
          continueDisabled={continueDisabled}
        />
      ) : null}
    </ChatTextContextMenu>
  )
})
