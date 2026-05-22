import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ExternalLink } from '@/shared/ui/icons'
import type { LinkPreviewResponse } from '@/shared/types/ipc'
import {
  linkHostname,
  normalizeLinkHref,
  resolveMarkdownLinkLabel
} from '@/shared/lib/link-display'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/shared/ui/hover-card'
import { Skeleton } from '@/shared/ui/skeleton'
import { menuSurfaceBorderClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'

const previewCache = new Map<string, LinkPreviewResponse>()

function isPreviewableHref(href: string | undefined): href is string {
  if (!href) return false
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function fallbackPreview(href: string): LinkPreviewResponse {
  const host = linkHostname(href)
  return { url: href, siteName: host, title: host }
}

interface LinkPreviewHoverProps {
  href: string
  className?: string
  children: ReactNode
}

function LinkPreviewCard({
  preview,
  href
}: {
  preview: LinkPreviewResponse
  href: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const title = preview.title?.trim() || preview.siteName || linkHostname(href)
  const description = preview.description?.trim()
  const siteName = preview.siteName ?? linkHostname(href)
  const showImage = Boolean(preview.image) && !imageFailed

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {showImage && preview.image ? (
        <div className="border-b border-border bg-muted/30">
          <img
            src={preview.image}
            alt=""
            className="h-32 w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : null}
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
        {description ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{siteName}</span>
        </p>
      </div>
    </a>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-3 p-3">
      <Skeleton className="h-28 w-full rounded-md" />
      <Skeleton className="h-4 w-[80%]" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function LinkPreviewHover({ href, className, children }: LinkPreviewHoverProps) {
  const canonicalHref = useMemo(() => normalizeLinkHref(href), [href])
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<LinkPreviewResponse | null>(() =>
    previewCache.get(canonicalHref) ?? null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPreview(previewCache.get(canonicalHref) ?? null)
    setLoading(false)
  }, [canonicalHref])

  useEffect(() => {
    if (!open || preview || !isLingoAvailable() || !window.lingo?.link) return

    const cached = previewCache.get(canonicalHref)
    if (cached) {
      setPreview(cached)
      return
    }

    let cancelled = false
    setLoading(true)

    void getLingo()
      .link.preview(canonicalHref)
      .then((data) => {
        if (cancelled) return
        const next = data.title || data.description || data.image ? data : fallbackPreview(canonicalHref)
        previewCache.set(canonicalHref, next)
        setPreview(next)
      })
      .catch(() => {
        if (!cancelled) {
          const next = fallbackPreview(canonicalHref)
          previewCache.set(canonicalHref, next)
          setPreview(next)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, canonicalHref, preview])

  const cardPreview = preview ?? fallbackPreview(canonicalHref)

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={350} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a href={canonicalHref} className={className} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        className={cn('w-80 p-0', menuSurfaceBorderClass)}
        side="top"
        align="start"
      >
        {loading && !preview ? (
          <PreviewSkeleton />
        ) : (
          <LinkPreviewCard preview={cardPreview} href={canonicalHref} />
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
      <a href={canonicalHref} className={className} target="_blank" rel="noopener noreferrer">
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
