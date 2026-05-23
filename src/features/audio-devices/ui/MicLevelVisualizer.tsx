import { cn } from '@/shared/lib/utils'

interface MicLevelVisualizerProps {
  levels: number[]
  isReceiving?: boolean
  className?: string
  maxBarHeight?: number
}

export function MicLevelVisualizer({
  levels,
  isReceiving = false,
  className,
  maxBarHeight = 18
}: MicLevelVisualizerProps) {
  return (
    <div
      className={cn('flex h-[18px] min-w-0 flex-1 items-end gap-[3px]', className)}
      role="meter"
      aria-label={isReceiving ? 'Microphone receiving audio' : 'No microphone signal'}
      aria-valuenow={Math.round((isReceiving ? 1 : 0) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {levels.map((level, index) => {
        const h = Math.max(2, Math.round(level * maxBarHeight))
        const active = level > 0.06
        return (
          <span
            key={index}
            className={cn(
              'w-[3px] shrink-0 rounded-full transition-[height,background-color] duration-75',
              active
                ? isReceiving
                  ? 'bg-foreground/85'
                  : 'bg-foreground/45'
                : 'bg-foreground/20'
            )}
            style={{ height: `${h}px` }}
          />
        )
      })}
    </div>
  )
}
