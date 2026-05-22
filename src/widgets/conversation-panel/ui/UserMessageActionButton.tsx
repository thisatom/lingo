import { Reply, Square } from 'lucide-react'
import { userMessageEditButtonClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface UserMessageActionButtonProps {
  mode: 'stop' | 'edit'
  disabled?: boolean
  onClick: () => void
}

export function UserMessageActionButton({
  mode,
  disabled,
  onClick
}: UserMessageActionButtonProps) {
  const isStop = mode === 'stop'

  if (isStop) {
    return (
      <TooltipIconButton
        type="button"
        size="iconSm"
        className={cn(
          userMessageEditButtonClass,
          'bg-foreground text-background hover:bg-foreground/90',
          disabled && 'pointer-events-none opacity-0'
        )}
        tooltip="Stop"
        aria-label="Stop agent"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
      >
        <Square className="size-3 fill-current" strokeWidth={0} />
      </TooltipIconButton>
    )
  }

  return (
    <TooltipIconButton
      type="button"
      variant="ghost"
      size="iconSm"
      className={cn(
        userMessageEditButtonClass,
        'text-muted-foreground/55 hover:bg-accent hover:text-muted-foreground',
        disabled && 'pointer-events-none opacity-0'
      )}
      tooltip="Edit message"
      aria-label="Edit message"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <Reply className="size-3.5" strokeWidth={2} />
    </TooltipIconButton>
  )
}
