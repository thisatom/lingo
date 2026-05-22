import { ChevronDown } from '@/shared/ui/icons'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface ScrollToLatestButtonProps {
  show: boolean
  onClick: () => void
  className?: string
}

export function ScrollToLatestButton({ show, onClick, className }: ScrollToLatestButtonProps) {
  if (!show) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Scroll to latest"
      onClick={onClick}
      className={cn(
        'grid size-8 shrink-0 place-items-center gap-0 rounded-full border border-menu-border bg-secondary p-0 text-foreground shadow-lg hover:bg-accent',
        className
      )}
    >
      <ChevronDown className="size-3.5 translate-y-px" />
    </Button>
  )
}
