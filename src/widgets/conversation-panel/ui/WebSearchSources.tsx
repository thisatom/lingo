import { useState } from 'react'
import type { MessageSearchSource } from '@/entities/message/model/types'
import { hostFromUrl, isBrowsableSearchTarget } from '@/shared/lib/web-search-targets'
import { siteFaviconUrl } from '@/shared/lib/site-favicon'
import {
  isPreviewableHref,
  useLinkPreview
} from '@/shared/lib/use-link-preview'
import {
  chipSurfaceClass,
  elevatedSurfaceClass,
  iconButtonHoverClass,
  panelRowHoverClass
} from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'
import { XIcon } from '@/shared/ui/icons'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { LinkPreviewHover } from '@/shared/ui/link-preview-hover'
import { LinkPreviewRow } from '@/shared/ui/link-preview-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Spinner } from '@/shared/ui/spinner'
import { chatNonSelectableClass } from './agent-layout'

const SOURCE_INLINE_LIMIT = 3

function SourceFavicon({ url }: { url: string }) {
  const host = hostFromUrl(url)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-md bg-muted text-[9px] font-semibold uppercase text-muted-foreground"
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
      className="size-4 shrink-0 rounded-md bg-muted/40 object-contain"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

function SourceChip({
  source,
  className
}: {
  source: MessageSearchSource
  className?: string
}) {
  const host = hostFromUrl(source.url)
  const chipClassName = cn(
    chipSurfaceClass,
    'max-w-[min(11rem,100%)] gap-1.5 py-0.5 pl-1 pr-2 text-[11px] font-medium leading-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    className
  )
  const chipContent = (
    <>
      <SourceFavicon url={source.url} />
      <span className="truncate">{host}</span>
    </>
  )

  if (isPreviewableHref(source.url) && window.lingo?.link) {
    return (
      <LinkPreviewHover href={source.url} className={chipClassName}>
        {chipContent}
      </LinkPreviewHover>
    )
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={chipClassName}
      title={source.title || host}
    >
      {chipContent}
    </a>
  )
}

function SourcePreviewRow({ source }: { source: MessageSearchSource }) {
  const { loading, resolved } = useLinkPreview(source.url)

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        panelRowHoverClass,
        'block p-2.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
      )}
    >
      <LinkPreviewRow
        href={source.url}
        preview={resolved}
        loading={loading}
        fallbackTitle={source.title}
      />
    </a>
  )
}

function SourcesPanel({
  sources,
  open,
  onOpenChange
}: {
  sources: MessageSearchSource[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            chipSurfaceClass,
            'shrink-0 px-2.5 py-0.5 text-[11px] font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
          )}
          aria-expanded={open}
          aria-label={`Show all ${sources.length} sources`}
        >
          {sources.length} sources
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden p-0 sm:w-80',
          elevatedSurfaceClass
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="text-sm font-medium leading-none text-foreground">Sources</p>
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground"
              aria-label={`${sources.length} sources`}
            >
              {sources.length}
            </span>
          </div>
          <button
            type="button"
            className={cn(
              'inline-flex size-7 shrink-0 items-center justify-center',
              iconButtonHoverClass
            )}
            aria-label="Close sources"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
        <CustomScrollArea variant="menu" className="max-h-72 min-h-0">
          <ul className="p-1">
            {sources.map((source) => (
              <li key={source.url} className="min-w-0">
                <SourcePreviewRow source={source} />
              </li>
            ))}
          </ul>
        </CustomScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function SourceList({ sources }: { sources: MessageSearchSource[] }) {
  return (
    <ul className="flex max-w-full flex-wrap items-center gap-1.5">
      {sources.map((source) => (
        <li key={source.url} className="max-w-full min-w-0">
          <SourceChip source={source} />
        </li>
      ))}
    </ul>
  )
}

export function WebSearchSources({
  sources,
  loading = false,
  visitingUrl = null
}: {
  sources: MessageSearchSource[]
  loading?: boolean
  visitingUrl?: string | null
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const items = sources.filter(isBrowsableSearchTarget)
  if (!loading && items.length === 0 && !visitingUrl) return null

  const visitingHost = visitingUrl ? hostFromUrl(visitingUrl) : null
  const collapseSources = items.length > SOURCE_INLINE_LIMIT
  const inlineSources = collapseSources ? items.slice(0, SOURCE_INLINE_LIMIT) : items

  return (
    <div
      className={cn(
        chatNonSelectableClass,
        'flex min-w-0 max-w-full flex-col items-start gap-2 py-0.5'
      )}
    >
      {loading || visitingHost ? (
        <div
          className={cn(
            chipSurfaceClass,
            'inline-flex max-w-full items-center gap-2 px-2.5 py-1 text-xs'
          )}
          aria-live="polite"
        >
          <Spinner className="size-3.5 shrink-0 opacity-80" />
          <span className="truncate leading-none">
            {visitingHost ? `Reading ${visitingHost}…` : 'Searching web…'}
          </span>
        </div>
      ) : null}

      {items.length > 0 ? (
        collapseSources ? (
          <div className="flex max-w-full flex-wrap items-center gap-1.5">
            {inlineSources.map((source) => (
              <SourceChip key={source.url} source={source} />
            ))}
            <SourcesPanel sources={items} open={sourcesOpen} onOpenChange={setSourcesOpen} />
          </div>
        ) : (
          <SourceList sources={items} />
        )
      ) : null}
    </div>
  )
}
