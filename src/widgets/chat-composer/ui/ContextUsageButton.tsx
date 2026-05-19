import type { ChatContextUsageDetails } from '@/shared/lib/chat-context-usage'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'
import { composerInputHoverClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/shared/ui/hover-card'

const RING_RADIUS = 7
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function formatTokens(value: number): string {
  return value.toLocaleString('en-US')
}

interface ContextUsageButtonProps {
  percent: number
  usage: ChatContextUsageDetails
  modelId: string
  disabled?: boolean
  onReset: () => void
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function ContextUsageButton({
  percent,
  usage,
  modelId,
  disabled,
  onReset
}: ContextUsageButtonProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const strokeOffset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE
  const remainingTokens = Math.max(0, usage.limitTokens - usage.usedTokens)

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Context ${clamped} percent. Reset context.`}
          className={cn(
            'flex h-7 shrink-0 items-center gap-1.5 px-2 text-muted-foreground transition-colors',
            composerInputHoverClass,
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
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-72 border-[#383838] bg-[#1e1e1e] p-3 text-xs"
      >
        <p className="mb-2 text-sm text-foreground">Context usage</p>
        <div className="space-y-1.5">
          <UsageRow label="Model" value={shortOpenRouterModelLabel(modelId)} />
          <UsageRow label="Used" value={`${formatTokens(usage.usedTokens)} / ${formatTokens(usage.limitTokens)} tokens`} />
          <UsageRow label="Remaining" value={`${formatTokens(remainingTokens)} tokens`} />
          <UsageRow label="Messages" value={`${usage.messageCount} (${formatTokens(usage.messageTokens)} tokens)`} />
          <UsageRow label="System reserve" value={`${formatTokens(usage.systemReserveTokens)} tokens`} />
          <UsageRow label="Reply budget" value={`${formatTokens(usage.outputReserveTokens)} tokens`} />
        </div>
        <p className="mt-2.5 border-t border-border/60 pt-2 text-muted-foreground">
          Click to reset — older messages are removed to free context.
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}
