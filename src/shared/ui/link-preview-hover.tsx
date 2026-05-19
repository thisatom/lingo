import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import type { LinkPreviewResponse } from '@/shared/types/ipc'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/shared/ui/hover-card'
import { Skeleton } from '@/shared/ui/skeleton'

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

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
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
  const title = preview.title?.trim() || preview.siteName || hostnameFromUrl(href)
  const description = preview.description?.trim()
  const siteName = preview.siteName ?? hostnameFromUrl(href)
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
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<LinkPreviewResponse | null>(() =>
    previewCache.get(href) ?? null
  )
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || preview || failed || !isLingoAvailable() || !window.lingo?.link) return

    const cached = previewCache.get(href)
    if (cached) {
      setPreview(cached)
      return
    }

    let cancelled = false
    setLoading(true)

    void getLingo()
      .link.preview(href)
      .then((data) => {
        if (cancelled) return
        previewCache.set(href, data)
        setPreview(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, href, preview, failed])

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={350} closeDelay={120}>
      <HoverCardTrigger asChild>
        <a href={href} className={className} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </HoverCardTrigger>
      {!failed ? (
        <HoverCardContent className="w-80 p-0" side="top" align="start">
          {loading && !preview ? (
            <PreviewSkeleton />
          ) : preview ? (
            <LinkPreviewCard preview={preview} href={href} />
          ) : (
            <div className="p-3 text-xs text-muted-foreground">{hostnameFromUrl(href)}</div>
          )}
        </HoverCardContent>
      ) : null}
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
  if (!isPreviewableHref(href) || !isLingoAvailable() || !window.lingo?.link) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <LinkPreviewHover href={href} className={className}>
      {children}
    </LinkPreviewHover>
  )
}
