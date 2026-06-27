import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import type { LinkPreviewResponse } from '@/shared/types/ipc'
import { normalizeLinkHref, resolveMarkdownLinkLabel } from '@/shared/lib/link-display'
import { isLingoAvailable } from '@/shared/lib/lingo'
import {
  fetchLinkPreviewCached,
  getCachedLinkPreview,
  isPreviewableHref
} from '@/shared/lib/use-link-preview'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/shared/ui/hover-card'
import {
  LinkPreviewCard,
  LinkPreviewLoadingCard,
  linkPreviewPopoverSurfaceClass,
  resolveLinkPreviewDisplay
} from '@/shared/ui/link-preview-card'
import { cn } from '@/shared/lib/utils'

interface LinkPreviewHoverProps {
  href: string
  className?: string
  children: ReactNode
}

const stopBubbleClick = (event: MouseEvent) => {
  event.stopPropagation()
}

export function LinkPreviewHover({ href, className, children }: LinkPreviewHoverProps) {
  const canonicalHref = useMemo(() => normalizeLinkHref(href), [href])
  const cachedPreview = useMemo(
    () => getCachedLinkPreview(canonicalHref) ?? null,
    [canonicalHref]
  )
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<LinkPreviewResponse | null>(cachedPreview)
  const [loading, setLoading] = useState(false)
  const [fetchDone, setFetchDone] = useState(Boolean(cachedPreview))

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) return

      const cached = getCachedLinkPreview(canonicalHref)
      if (cached) {
        setPreview(cached)
        setFetchDone(true)
        setLoading(false)
        return
      }

      setPreview(null)
      setFetchDone(false)
      setLoading(true)
    },
    [canonicalHref]
  )

  useEffect(() => {
    const cached = getCachedLinkPreview(canonicalHref)
    setPreview(cached ?? null)
    setFetchDone(Boolean(cached))
    setLoading(false)
  }, [canonicalHref])

  useEffect(() => {
    if (!open || fetchDone || !isLingoAvailable() || !window.lingo?.link) return

    let cancelled = false
    setLoading(true)

    void fetchLinkPreviewCached(canonicalHref)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setFetchDone(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, canonicalHref, fetchDone])

  const displayPreview = resolveLinkPreviewDisplay(preview, canonicalHref, loading && !fetchDone)
  const showLoading = open && loading && !displayPreview

  return (
    <HoverCard open={open} onOpenChange={handleOpenChange} openDelay={350} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a
          href={canonicalHref}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopBubbleClick}
        >
          {children}
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(linkPreviewPopoverSurfaceClass, '!p-0')}
        side="top"
        align="start"
        sideOffset={8}
      >
        {showLoading || !displayPreview ? (
          <LinkPreviewLoadingCard />
        ) : (
          <LinkPreviewCard href={canonicalHref} preview={displayPreview} />
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export function MarkdownLink({
  href,
  className,
  children
}: {
  href?: string
  className?: string
  children?: ReactNode
}) {
  const label = resolveMarkdownLinkLabel(href, children) ?? children
  const canonicalHref = href ? normalizeLinkHref(href) : href

  if (!isPreviewableHref(canonicalHref) || !isLingoAvailable() || !window.lingo?.link) {
    return (
      <a
        href={canonicalHref}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stopBubbleClick}
      >
        {label}
      </a>
    )
  }

  return (
    <LinkPreviewHover href={canonicalHref} className={className}>
      {label}
    </LinkPreviewHover>
  )
}
