import { ChevronDown } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface ScrollToLatestButtonProps {
  show: boolean
  onClick: () => void
  className?: string
}

export function ScrollToLatestButton({ show, onClick, className }: ScrollToLatestButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Scroll to latest"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={onClick}
      className={cn(
        'grid size-8 shrink-0 place-items-center gap-0 rounded-full border border-overlay-border bg-secondary p-0 text-foreground shadow-md shadow-black/10 transition-colors hover:bg-accent hover:text-accent-foreground dark:shadow-black/35',
        !show && 'pointer-events-none opacity-0',
        className
      )}
    >
      <ChevronDown className="size-3.5 translate-y-px" strokeWidth={2} />
    </Button>
  )
}
