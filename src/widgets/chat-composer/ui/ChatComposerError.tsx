import { RotateCw, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface ChatComposerErrorProps {
  message: string
  onDismiss: () => void
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ChatComposerError({
  message,
  onDismiss,
  onRetry,
  retrying,
  className
}: ChatComposerErrorProps) {
  const showRetry = Boolean(onRetry)

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5',
        className
      )}
    >
      <p className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-destructive">{message}</p>
      <div className="flex shrink-0 items-center gap-1">
        {showRetry && (
          <Button
            type="button"
            variant="outline"
            size="compact"
            className="h-7 border-destructive/30 bg-transparent text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
            disabled={retrying}
            onClick={onRetry}
          >
            <RotateCw className={cn('size-3.5', retrying && 'animate-spin')} />
            Try again
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive/80 hover:bg-destructive/15 hover:text-destructive"
          aria-label="Dismiss error"
          onClick={onDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
