import type { PipelineSearchTarget } from '@/entities/conversation/model/store'
import { hostFromUrl } from '@/shared/lib/web-search-targets'
import { cn } from '@/shared/lib/utils'

export function SearchTargetList({
  targets,
  className
}: {
  targets: readonly PipelineSearchTarget[]
  /** @deprecated Active URL is shown in the status header, not per row. */
  activeUrl?: string | null
  className?: string
}) {
  if (targets.length === 0) return null

  return (
    <ul className={cn('mt-2 space-y-1', className)}>
      {targets.map((target) => {
        const host = target.url ? hostFromUrl(target.url) : target.title
        const sub =
          target.title && target.url && target.title !== host && !target.title.includes(host)
            ? target.title
            : null

        return (
          <li
            key={`${target.url}-${target.title}`}
            className="flex min-w-0 items-start gap-2 text-[13px] leading-snug text-muted-foreground"
          >
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/45"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              {target.url ? <span>{host}</span> : <span>{target.title}</span>}
              {sub ? <span className="mt-0.5 block truncate text-[12px] opacity-80">{sub}</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
