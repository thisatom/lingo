import { ArrowDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

interface ScrollToLatestButtonProps {
  show: boolean
  onClick: () => void
  className?: string
}

export function ScrollToLatestButton({ show, onClick, className }: ScrollToLatestButtonProps) {
  if (!show) return null

  return (
    <TooltipIconButton
      variant="outline"
      size="icon"
      tooltip="Scroll to latest"
      aria-label="Scroll to latest"
      onClick={onClick}
      className={cn(
        'size-8 shrink-0 rounded-full border border-[#383838] bg-[#2a2a2a] text-foreground shadow-lg hover:bg-[#333333]',
        className
      )}
    >
      <ArrowDown className="size-4" />
    </TooltipIconButton>
  )
}
