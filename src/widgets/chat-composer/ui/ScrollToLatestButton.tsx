import { ArrowDown } from 'lucide-react'
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
        'size-8 shrink-0 rounded-full border border-border bg-secondary text-foreground shadow-lg hover:bg-accent',
        className
      )}
    >
      <ArrowDown className="size-4" />
    </Button>
  )
}
