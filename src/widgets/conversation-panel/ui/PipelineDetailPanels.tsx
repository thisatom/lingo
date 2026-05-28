import type { PipelineSearchTarget } from '@/entities/conversation/model/store'
import { hostFromUrl } from '@/shared/lib/web-search-targets'
import { cn } from '@/shared/lib/utils'
import { Loader2Icon } from '@/shared/ui/icons'

export function SearchTargetList({
  targets,
  activeUrl = null,
  className
}: {
  targets: readonly PipelineSearchTarget[]
  activeUrl?: string | null
  className?: string
}) {
  if (targets.length === 0) return null

  const activeHost = activeUrl ? hostFromUrl(activeUrl) : null

  return (
    <ul className={cn('mt-2 space-y-1', className)}>
      {targets.map((target) => {
        const host = target.url ? hostFromUrl(target.url) : target.title
        const isActive = Boolean(activeHost && target.url && hostFromUrl(target.url) === activeHost)
        const sub =
          target.title && target.url && target.title !== host && !target.title.includes(host)
            ? target.title
            : null

        return (
          <li
            key={`${target.url}-${target.title}`}
            className={cn(
              'flex min-w-0 items-start gap-2 text-[13px] leading-snug',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {isActive ? (
              <Loader2Icon className="mt-0.5 size-3.5 shrink-0 animate-spin opacity-80" />
            ) : (
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/45"
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">
              {target.url ? (
                <span className={cn(isActive && 'font-medium text-foreground')}>{host}</span>
              ) : (
                <span>{target.title}</span>
              )}
              {sub ? <span className="mt-0.5 block truncate text-[12px] opacity-80">{sub}</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
