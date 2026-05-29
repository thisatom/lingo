import { useState } from 'react'
import type { MessageSearchSource } from '@/entities/message/model/types'
import { hostFromUrl, isBrowsableSearchTarget } from '@/shared/lib/web-search-targets'
import { siteFaviconUrl } from '@/shared/lib/site-favicon'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Spinner } from '@/shared/ui/spinner'
import { chatNonSelectableClass } from './agent-layout'

function SourceFavicon({ url }: { url: string }) {
  const host = hostFromUrl(url)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[9px] font-semibold uppercase text-muted-foreground"
        aria-hidden
      >
        {host.charAt(0) || '?'}
      </span>
    )
  }

  return (
    <img
      src={siteFaviconUrl(url)}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0 rounded-sm bg-muted/40 object-contain"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export function WebSearchSources({
  sources,
  loading = false
}: {
  sources: MessageSearchSource[]
  loading?: boolean
}) {
  const items = sources.filter(isBrowsableSearchTarget)
  if (!loading && items.length === 0) return null

  const showLoading = loading
  const showSources = items.length > 0

  return (
    <div
      className={cn(
        chatNonSelectableClass,
        'flex flex-col items-start',
        showLoading && showSources ? 'gap-3' : showLoading || showSources ? 'gap-2' : ''
      )}
    >
      {showLoading ? (
        <div
          className="inline-flex h-6 items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2.5 text-xs text-muted-foreground"
          aria-live="polite"
        >
          <Spinner className="size-3.5 shrink-0 opacity-80" />
          <span className="leading-none">Searching web</span>
        </div>
      ) : null}

      {showSources ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Sources, ${items.length} links`}
              className={cn(
                'inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border border-border/80',
                'bg-chat-assistant py-0.5 pl-2 pr-0.5',
                'text-xs font-medium text-muted-foreground',
                'transition-colors hover:bg-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                chatNonSelectableClass
              )}
            >
              <span>Sources</span>
              <span
                className={cn(
                  'inline-flex size-[18px] min-w-[18px] items-center justify-center rounded-full',
                  'border border-border/80 bg-background text-[10px] font-semibold leading-none tabular-nums',
                  'text-foreground/80'
                )}
                aria-hidden
              >
                {items.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={6}
            className={cn(
              'w-64 overflow-hidden rounded-xl border border-chat-message-border p-0 shadow-md',
              'bg-popover'
            )}
          >
            <CustomScrollArea variant="menu" className="max-h-64">
              <ul className="p-1">
                {items.map((source) => {
                  const host = hostFromUrl(source.url)
                  const sub =
                    source.title && source.title !== host && !source.title.includes(host)
                      ? source.title
                      : null
                  return (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex min-w-0 items-start gap-2 rounded-md px-1.5 py-1.5',
                          'text-[12px] leading-snug transition-colors',
                          'hover:bg-accent'
                        )}
                      >
                        <SourceFavicon url={source.url} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{host}</span>
                          {sub ? (
                            <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                              {sub}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </CustomScrollArea>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
