import type { Chat } from '@/entities/chat/model/types'
import type { ChatContextUsageDetails } from '@/shared/lib/chat-context-usage'
import { ContextUsageDetails } from '@/features/chat-context/ui/ContextUsageDetails'
import { ContextUsageRing } from '@/features/chat-context/ui/ContextUsageRing'
import { sidebarMenuSurfaceClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/shared/ui/hover-card'

function formatChatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-foreground">{value}</span>
    </div>
  )
}

interface ChatHeaderTitleProps {
  title: string
  chat: Chat | null | undefined
  messageCount: number
  modelId: string
  contextUsage: ChatContextUsageDetails | null
  contextPercent: number
}

export function ChatHeaderTitle({
  title,
  chat,
  messageCount,
  modelId,
  contextUsage,
  contextPercent
}: ChatHeaderTitleProps) {
  const clamped = Math.min(100, Math.max(0, contextPercent))
  const hasContext = contextUsage != null && messageCount > 0

  return (
    <div className="min-w-0 flex-1">
    <HoverCard openDelay={200} closeDelay={80}>
      <HoverCardTrigger asChild>
        <h1
          className={cn(
            'inline-flex max-w-full min-w-0 cursor-default truncate rounded-md px-2 py-1',
            'text-[13px] font-normal leading-[1.5] text-foreground transition-colors hover:bg-chat-header-hover',
            'outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
        >
          {title}
        </h1>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={6}
        className={cn('w-72 p-3 text-xs', sidebarMenuSurfaceClass)}
      >
        <p className="text-sm leading-snug text-foreground">{title}</p>

        <div className="mt-2.5 space-y-1.5">
          <InfoRow label="Messages" value={String(messageCount)} />
          {chat ? (
            <>
              <InfoRow label="Created" value={formatChatTimestamp(chat.createdAt)} />
              <InfoRow label="Updated" value={formatChatTimestamp(chat.updatedAt)} />
            </>
          ) : null}
        </div>

        {hasContext ? (
          <>
            <div
              className={cn(
                'mt-3 flex items-center gap-2 border-t border-border/60 pt-3',
                clamped >= 85 && 'text-amber-400/90',
                clamped >= 95 && 'text-red-400/90'
              )}
            >
              <ContextUsageRing percent={clamped} size={18} className="shrink-0" />
              <span className="text-sm tabular-nums text-foreground">{clamped}% context</span>
            </div>
            <ContextUsageDetails
              usage={contextUsage}
              modelId={modelId}
              className="mt-2.5"
            />
          </>
        ) : (
          <p className="mt-3 border-t border-border/60 pt-2.5 text-muted-foreground">
            Send a message to start tracking context usage.
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
    </div>
  )
}
