import { cn } from '@/shared/lib/utils'
import './stream-cursor.css'

type StreamCursorProps = {
  className?: string
}

/** Blinking caret shown while assistant answer text is streaming. */
export function StreamCursor({ className }: StreamCursorProps) {
  return (
    <span
      role="presentation"
      aria-hidden
      className={cn('stream-cursor ml-0.5 inline-block h-[1.05em] w-[2px] align-text-bottom', className)}
    />
  )
}
