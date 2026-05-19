import { cn } from '@/shared/lib/utils'
import { TooltipWrap } from '@/shared/ui/tooltip-wrap'

const RING_RADIUS = 7
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface ContextUsageButtonProps {
  percent: number
  disabled?: boolean
  onReset: () => void
}

export function ContextUsageButton({ percent, disabled, onReset }: ContextUsageButtonProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const strokeOffset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE

  return (
    <TooltipWrap label="Reset context (remove older messages)">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Context ${clamped} percent. Reset context.`}
        className={cn(
          'flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2 text-muted-foreground transition-colors',
          'hover:bg-[#303030] hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
          clamped >= 85 && 'text-amber-400/90 hover:text-amber-300',
          clamped >= 95 && 'text-red-400/90 hover:text-red-300'
        )}
        onClick={onReset}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 18 18"
          className="-rotate-90 shrink-0"
          aria-hidden
        >
          <circle
            cx={9}
            cy={9}
            r={RING_RADIUS}
            fill="none"
            stroke="#3a3a3a"
            strokeWidth={2}
          />
          <circle
            cx={9}
            cy={9}
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <span className="text-[13px] leading-none tabular-nums">{clamped}% context</span>
      </button>
    </TooltipWrap>
  )
}
