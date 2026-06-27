import { useEffect, useMemo, useState } from 'react'
import { linkHostname, normalizeLinkHref } from '@/shared/lib/link-display'
import type { LinkPreviewResponse } from '@/shared/types/ipc'

const previewCache = new Map<string, LinkPreviewResponse>()

/** @internal Vitest only — clears module cache between tests. */
export function clearLinkPreviewCacheForTests(): void {
  previewCache.clear()
}

export function isPreviewableHref(href: string | undefined): href is string {
  if (!href) return false
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function fallbackLinkPreview(href: string): LinkPreviewResponse {
  const host = linkHostname(href)
  return { url: href, siteName: host, title: host }
}

export function getCachedLinkPreview(href: string): LinkPreviewResponse | undefined {
  return previewCache.get(normalizeLinkHref(href))
}

export async function fetchLinkPreviewCached(href: string): Promise<LinkPreviewResponse> {
  const canonicalHref = normalizeLinkHref(href)
  const cached = previewCache.get(canonicalHref)
  if (cached) return cached

  const linkPreview = window.lingo?.link?.preview
  if (!linkPreview) {
    const fallback = fallbackLinkPreview(canonicalHref)
    previewCache.set(canonicalHref, fallback)
    return fallback
  }

  try {
    const data = await linkPreview(canonicalHref)
    const next =
      data.title || data.description || data.image
        ? data
        : fallbackLinkPreview(canonicalHref)
    previewCache.set(canonicalHref, next)
    return next
  } catch {
    const fallback = fallbackLinkPreview(canonicalHref)
    previewCache.set(canonicalHref, fallback)
    return fallback
  }
}

export function useLinkPreview(href: string, enabled = true) {
  const canonicalHref = useMemo(() => normalizeLinkHref(href), [href])
  const [preview, setPreview] = useState<LinkPreviewResponse | null>(
    () => previewCache.get(canonicalHref) ?? null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const cached = previewCache.get(canonicalHref)
    if (cached) {
      setPreview(cached)
      return
    }

    let cancelled = false
    setLoading(true)

    void fetchLinkPreviewCached(canonicalHref)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [canonicalHref, enabled])

  return {
    preview,
    loading,
    resolved: preview ?? (loading ? null : fallbackLinkPreview(canonicalHref))
  }
}
