import { useState } from 'react'
import { ReplyTranslateMenu } from '@/features/message-translate/ui/ReplyTranslateMenu'
import { ReplySpeakButton } from '@/features/text-to-speech/ui/ReplySpeakButton'
import { Check, Copy, RotateCw } from '@/shared/ui/icons'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import {
  messageActionButtonClass,
  messageActionDividerClass,
  messageActionsBarClass,
  messageActionsGroupClass
} from '@/widgets/conversation-panel/ui/agent-layout'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  content: string
  isShowingTranslation?: boolean
  translateLoading?: boolean
  fromLang?: string
  toLang?: string
  onToggleTranslation?: () => void
  onFromLangChange?: (value: string) => void
  onToLangChange?: (value: string) => void
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  className?: string
}

export function AgentMessageActions({
  content,
  isShowingTranslation = false,
  translateLoading = false,
  fromLang = 'auto',
  toLang = 'en',
  onToggleTranslation,
  onFromLangChange,
  onToLangChange,
  onRegenerate,
  regenerateDisabled = false,
  className
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = content.trim()
    if (!text) return
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(messageActionsBarClass, className)} role="group" aria-label="Reply actions">
      <div className={messageActionsGroupClass}>
        <TooltipIconButton
          type="button"
          variant="ghost"
          size="icon-xs"
          className={messageActionButtonClass}
          tooltip={copied ? 'Copied' : 'Copy'}
          aria-label={copied ? 'Copied' : 'Copy reply'}
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </TooltipIconButton>

        <span className={messageActionDividerClass} aria-hidden />

        <ReplySpeakButton content={content} />

        {onRegenerate ? (
          <>
            <span className={messageActionDividerClass} aria-hidden />
            <TooltipIconButton
              type="button"
              variant="ghost"
              size="icon-xs"
              className={messageActionButtonClass}
              tooltip="Regenerate"
              aria-label="Regenerate reply"
              disabled={regenerateDisabled}
              onClick={onRegenerate}
            >
              <RotateCw className="size-3.5" />
            </TooltipIconButton>
          </>
        ) : null}

        {onToggleTranslation && onFromLangChange && onToLangChange ? (
          <ReplyTranslateMenu
            isShowingTranslation={isShowingTranslation}
            loading={translateLoading}
            fromLang={fromLang}
            toLang={toLang}
            onToggle={onToggleTranslation}
            onFromLangChange={onFromLangChange}
            onToLangChange={onToLangChange}
          />
        ) : null}
      </div>
    </div>
  )
}
