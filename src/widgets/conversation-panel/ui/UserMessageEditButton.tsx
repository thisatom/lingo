import { Reply } from '@/shared/ui/icons'
import { userMessageEditButtonClass } from './agent-layout'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface UserMessageEditButtonProps {
  disabled?: boolean
  onEdit: () => void
}

export function UserMessageEditButton({ disabled, onEdit }: UserMessageEditButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(userMessageEditButtonClass, disabled && 'pointer-events-none opacity-0')}
      aria-label="Edit message"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onEdit()
      }}
    >
      <Reply className="size-3.5" />
    </Button>
  )
}
