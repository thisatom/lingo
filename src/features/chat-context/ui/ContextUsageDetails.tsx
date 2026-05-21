import type { ChatContextUsageDetails } from '@/shared/lib/chat-context-usage'
import { shortOpenRouterModelLabel } from '@/widgets/chat-composer/lib/model-label'

function formatTokens(value: number): string {
  return value.toLocaleString('en-US')
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums text-foreground">{value}</span>
    </div>
  )
}

interface ContextUsageDetailsProps {
  usage: ChatContextUsageDetails
  modelId: string
  className?: string
}

export function ContextUsageDetails({ usage, modelId, className }: ContextUsageDetailsProps) {
  const remainingTokens = Math.max(0, usage.limitTokens - usage.usedTokens)

  return (
    <div className={className}>
      <div className="space-y-1.5">
        <UsageRow label="Model" value={shortOpenRouterModelLabel(modelId)} />
        <UsageRow
          label="Used"
          value={`${formatTokens(usage.usedTokens)} / ${formatTokens(usage.limitTokens)} tokens`}
        />
        <UsageRow label="Remaining" value={`${formatTokens(remainingTokens)} tokens`} />
        <UsageRow
          label="Messages"
          value={`${usage.messageCount} (${formatTokens(usage.messageTokens)} tokens)`}
        />
        <UsageRow label="System reserve" value={`${formatTokens(usage.systemReserveTokens)} tokens`} />
        <UsageRow label="Reply budget" value={`${formatTokens(usage.outputReserveTokens)} tokens`} />
      </div>
    </div>
  )
}
