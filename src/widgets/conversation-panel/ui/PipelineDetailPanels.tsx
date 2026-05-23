import type { PipelineSearchTarget } from '@/entities/conversation/model/store'
import { cn } from '@/shared/lib/utils'

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function SearchTargetList({
  targets,
  className
}: {
  targets: readonly PipelineSearchTarget[]
  className?: string
}) {
  if (targets.length === 0) return null

  return (
    <ul className={cn('mt-2 space-y-1.5', className)}>
      {targets.map((target) => {
        const label = target.url ? hostLabel(target.url) : target.title
        const sub = target.title && target.url && target.title !== label ? target.title : null

        if (target.url) {
          return (
            <li key={`${target.url}-${target.title}`} className="min-w-0 text-[13px] leading-snug">
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                {label}
              </a>
              {sub ? (
                <span className="mt-0.5 block truncate text-muted-foreground">{sub}</span>
              ) : null}
            </li>
          )
        }

        return (
          <li
            key={target.title}
            className="min-w-0 text-[13px] leading-snug text-muted-foreground"
          >
            {target.title}
          </li>
        )
      })}
    </ul>
  )
}
