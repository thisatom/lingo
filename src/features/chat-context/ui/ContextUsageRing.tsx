import { cn } from '@/shared/lib/utils'

const RING_RADIUS = 7
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface ContextUsageRingProps {
  percent: number
  className?: string
  /** SVG width/height in px @default 16 */
  size?: number
}

export function ContextUsageRing({ percent, className, size = 16 }: ContextUsageRingProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const strokeOffset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE
  const viewSize = 18

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className={cn('-rotate-90 shrink-0', className)}
      aria-hidden
    >
      <circle
        cx={viewSize / 2}
        cy={viewSize / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="#3a3a3a"
        strokeWidth={2}
      />
      <circle
        cx={viewSize / 2}
        cy={viewSize / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={strokeOffset}
      />
    </svg>
  )
}
