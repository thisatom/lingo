import { useState, type ReactNode } from 'react'
import { ExternalLink } from '@/shared/ui/icons'
import type { LinkPreviewResponse } from '@/shared/types/ipc'
import { linkHostname } from '@/shared/lib/link-display'
import { siteFaviconUrl } from '@/shared/lib/site-favicon'
import { elevatedSurfaceClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { Spinner } from '@/shared/ui/spinner'

export function resolveLinkPreviewDisplay(
  preview: LinkPreviewResponse | null | undefined,
  href: string,
  loading: boolean
): LinkPreviewResponse | null {
  if (preview) return preview
  if (loading) return null
  const host = linkHostname(href)
  return { url: href, siteName: host, title: host }
}

function LinkPreviewFavicon({ href, siteName }: { href: string; siteName: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[9px] font-semibold uppercase text-muted-foreground"
        aria-hidden
      >
        {siteName.charAt(0) || '?'}
      </span>
    )
  }

  return (
    <img
      src={siteFaviconUrl(href, 32)}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0 rounded bg-muted/40 object-contain"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

function LinkPreviewMedia({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <div className="relative aspect-[1.91/1] w-full border-b border-border bg-muted/25">
      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : null}
      <img
        src={src}
        alt={alt}
        className={cn(
          'size-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

export function LinkPreviewLoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('w-72 overflow-hidden', className)} aria-busy="true" aria-label="Loading link preview">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Skeleton className="size-4 shrink-0 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="relative flex aspect-[1.91/1] items-center justify-center bg-muted/20">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-2 px-3 py-3">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

interface LinkPreviewCardProps {
  href: string
  preview: LinkPreviewResponse
  className?: string
  footer?: ReactNode
}

export function LinkPreviewCard({ href, preview, className, footer }: LinkPreviewCardProps) {
  const siteName = preview.siteName?.trim() || linkHostname(href)
  const title = preview.title?.trim()
  const description = preview.description?.trim()
  const imageUrl = preview.image?.trim()
  const headline = title && title !== siteName ? title : null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <LinkPreviewFavicon href={href} siteName={siteName} />
        <span className="min-w-0 truncate text-xs text-muted-foreground">{siteName}</span>
        <ExternalLink className="ml-auto size-3 shrink-0 text-muted-foreground/70" aria-hidden />
      </div>

      {imageUrl ? <LinkPreviewMedia src={imageUrl} alt={headline ?? siteName} /> : null}

      <div className="space-y-1 px-3 py-2.5">
        {headline ? (
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{headline}</p>
        ) : null}
        {description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : !headline ? (
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{siteName}</p>
        ) : null}
        {footer}
      </div>
    </a>
  )
}

export const linkPreviewPopoverSurfaceClass = cn(
  'w-72 overflow-hidden p-0',
  elevatedSurfaceClass
)

interface LinkPreviewRowProps {
  href: string
  preview: LinkPreviewResponse | null
  loading?: boolean
  fallbackTitle?: string
  className?: string
}

export function LinkPreviewRow({
  href,
  preview,
  loading = false,
  fallbackTitle,
  className
}: LinkPreviewRowProps) {
  const resolved = resolveLinkPreviewDisplay(preview, href, loading)
  const siteName = resolved?.siteName ?? linkHostname(href)
  const title = resolved?.title?.trim() || fallbackTitle?.trim() || siteName
  const description = resolved?.description?.trim()

  return (
    <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
      <span className="mt-0.5 shrink-0">
        <LinkPreviewFavicon href={href} siteName={siteName} />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        {loading && !preview ? (
          <>
            <Skeleton className="h-3.5 w-[85%]" />
            <Skeleton className="h-3 w-full" />
          </>
        ) : (
          <>
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
            {description ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </>
        )}
        <p className="truncate text-[11px] text-muted-foreground">{siteName}</p>
      </div>
    </div>
  )
}
