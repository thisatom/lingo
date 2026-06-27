import { listRowHoverClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'

type LoadEarlierTurnsButtonProps = {
  remaining: number
  onLoad: () => void
  className?: string
}

export function LoadEarlierTurnsButton({
  remaining,
  onLoad,
  className
}: LoadEarlierTurnsButtonProps) {
  if (remaining <= 0) return null

  return (
    <div className={cn('flex justify-center pb-2', className)}>
      <button
        type="button"
        onClick={onLoad}
        className={cn(
          'cursor-pointer px-3 py-1.5 text-xs text-muted-foreground',
          listRowHoverClass
        )}
      >
        Load earlier messages ({remaining})
      </button>
    </div>
  )
}
