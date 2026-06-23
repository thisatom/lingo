import { useState } from 'react'
import { ReplyTranslatePopover } from '@/features/message-translate/ui/ReplyTranslatePopover'
import { ReplySpeakButton } from '@/features/text-to-speech/ui/ReplySpeakButton'
import { Check, Copy, RotateCw } from '@/shared/ui/icons'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import { messageActionButtonClass } from '@/widgets/conversation-panel/ui/agent-layout'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  content: string
  onRegenerate?: () => void
  regenerateDisabled?: boolean
  className?: string
}

export function AgentMessageActions({
  content,
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
    <div
      className={cn('flex items-center gap-0.5 px-3 pb-1.5 pt-0', className)}
      role="group"
      aria-label="Reply actions"
    >
      <TooltipIconButton
        type="button"
        variant="ghost"
        size="iconSm"
        className={messageActionButtonClass}
        tooltip={copied ? 'Copied' : 'Copy'}
        aria-label={copied ? 'Copied' : 'Copy reply'}
        onClick={() => void handleCopy()}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </TooltipIconButton>

      <ReplySpeakButton content={content} />
      <ReplyTranslatePopover content={content} />

      {onRegenerate ? (
        <TooltipIconButton
          type="button"
          variant="ghost"
          size="iconSm"
          className={messageActionButtonClass}
          tooltip="Regenerate"
          aria-label="Regenerate reply"
          disabled={regenerateDisabled}
          onClick={onRegenerate}
        >
          <RotateCw className="size-3.5" />
        </TooltipIconButton>
      ) : null}
    </div>
  )
}
