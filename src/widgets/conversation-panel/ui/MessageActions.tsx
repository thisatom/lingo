import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Copy, Pencil, RotateCw } from 'lucide-react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface ActionButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  activeLabel?: string
  active?: boolean
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  activeLabel,
  active
}: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-foreground"
      disabled={disabled}
      onClick={onClick}
      title={active && activeLabel ? activeLabel : label}
      aria-label={active && activeLabel ? activeLabel : label}
    >
      <Icon className="size-3.5" />
    </Button>
  )
}

function CopyActionButton({
  text,
  disabled
}: {
  text: string
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ActionButton
      label="Copy"
      activeLabel="Copied"
      active={copied}
      icon={copied ? Check : Copy}
      onClick={() => void handleCopy()}
      disabled={disabled}
    />
  )
}

interface MessageActionsProps {
  className?: string
  disabled?: boolean
  children: ReactNode
}

export function MessageActions({ className, disabled, children }: MessageActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100',
        disabled && 'pointer-events-none !opacity-0',
        className
      )}
    >
      {children}
    </div>
  )
}

interface UserMessageActionsProps {
  content: string
  disabled?: boolean
  onEdit: () => void
}

export function UserMessageActions({ content, disabled, onEdit }: UserMessageActionsProps) {
  return (
    <MessageActions disabled={disabled}>
      <CopyActionButton text={content} disabled={disabled} />
      <ActionButton
        label="Edit"
        icon={Pencil}
        onClick={onEdit}
        disabled={disabled}
      />
    </MessageActions>
  )
}

interface AgentMessageActionsProps {
  content: string
  disabled?: boolean
  onRegenerate: () => void
}

export function AgentMessageActions({
  content,
  disabled,
  onRegenerate
}: AgentMessageActionsProps) {
  return (
    <MessageActions disabled={disabled}>
      <CopyActionButton text={content} disabled={disabled} />
      <ActionButton
        label="Regenerate"
        icon={RotateCw}
        onClick={onRegenerate}
        disabled={disabled}
      />
    </MessageActions>
  )
}
