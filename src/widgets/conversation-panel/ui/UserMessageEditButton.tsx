import { Reply } from 'lucide-react'
import { userMessageEditButtonClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface UserMessageEditButtonProps {
  disabled?: boolean
  onEdit: () => void
}

export function UserMessageEditButton({ disabled, onEdit }: UserMessageEditButtonProps) {
  return (
    <TooltipIconButton
      variant="ghost"
      size="icon"
      className={cn(userMessageEditButtonClass, disabled && 'pointer-events-none opacity-0')}
      tooltip="Edit"
      aria-label="Edit message"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onEdit()
      }}
    >
      <Reply className="size-4" />
    </TooltipIconButton>
  )
}
