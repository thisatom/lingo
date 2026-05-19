import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Copy, Pencil, RotateCw } from 'lucide-react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface ActionButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  activeLabel?: string
  active?: boolean
  compact?: boolean
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  activeLabel,
  active,
  compact
}: ActionButtonProps) {
  const tooltip = active && activeLabel ? activeLabel : label

  return (
    <TooltipIconButton
      variant="ghost"
      size="icon"
      className={cn(
        'text-muted-foreground hover:text-foreground',
        compact ? 'size-6' : 'size-7'
      )}
      disabled={disabled}
      tooltip={tooltip}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
    </TooltipIconButton>
  )
}

function CopyActionButton({
  text,
  disabled,
  compact
}: {
  text: string
  disabled?: boolean
  compact?: boolean
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
      compact={compact}
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
        'flex items-center justify-center gap-0.5 opacity-0 transition-opacity',
        'pointer-events-none group-hover/message:pointer-events-auto group-hover/message:opacity-100',
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
  className?: string
  compact?: boolean
  onEdit: () => void
}

export function UserMessageActions({
  content,
  disabled,
  className,
  compact,
  onEdit
}: UserMessageActionsProps) {
  return (
    <MessageActions className={className} disabled={disabled}>
      <CopyActionButton text={content} disabled={disabled} compact={compact} />
      <ActionButton
        label="Edit"
        icon={Pencil}
        onClick={onEdit}
        disabled={disabled}
        compact={compact}
      />
    </MessageActions>
  )
}

interface AgentMessageActionsProps {
  content: string
  disabled?: boolean
  className?: string
  compact?: boolean
  onRegenerate: () => void
}

export function AgentMessageActions({
  content,
  disabled,
  className,
  compact,
  onRegenerate
}: AgentMessageActionsProps) {
  return (
    <MessageActions className={className} disabled={disabled}>
      <CopyActionButton text={content} disabled={disabled} compact={compact} />
      <ActionButton
        label="Regenerate"
        icon={RotateCw}
        onClick={onRegenerate}
        disabled={disabled}
        compact={compact}
      />
    </MessageActions>
  )
}
