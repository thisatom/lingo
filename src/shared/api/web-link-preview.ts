import type { LinkPreviewResponse } from '@/shared/types/ipc'
import { linkHostname } from '@/shared/lib/link-display'
import {
  readMetaContent,
  readTitleFromHtml,
  resolvePreviewAssetUrl
} from '@/shared/lib/link-preview-parse'

const previewCache = new Map<string, LinkPreviewResponse>()
const MAX_HTML_BYTES = 256_000
const FETCH_TIMEOUT_MS = 8_000

export async function fetchWebLinkPreview(url: string): Promise<LinkPreviewResponse> {
  const trimmed = url.trim()
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { url: trimmed }
  }

  const canonical = parsed.href
  const cached = previewCache.get(canonical)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(canonical, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Lingo/1.0 (link preview)'
      }
    })

    if (!response.ok) {
      const fallback: LinkPreviewResponse = {
        url: canonical,
        siteName: linkHostname(canonical),
        title: linkHostname(canonical)
      }
      previewCache.set(canonical, fallback)
      return fallback
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      const fallback: LinkPreviewResponse = {
        url: canonical,
        siteName: linkHostname(canonical),
        title: linkHostname(canonical)
      }
      previewCache.set(canonical, fallback)
      return fallback
    }

    const reader = response.body?.getReader()
    if (!reader) {
      return { url: canonical, siteName: linkHostname(canonical) }
    }

    let html = ''
    let total = 0
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read()
      if (done || !value) break
      total += value.length
      html += new TextDecoder().decode(value)
      if (total >= MAX_HTML_BYTES) break
    }
    reader.cancel().catch(() => {})

    const preview: LinkPreviewResponse = {
      url: canonical,
      title:
        readMetaContent(html, 'og:title') ??
        readMetaContent(html, 'twitter:title') ??
        readTitleFromHtml(html) ??
        undefined,
      description:
        readMetaContent(html, 'og:description') ??
        readMetaContent(html, 'twitter:description') ??
        readMetaContent(html, 'description') ??
        undefined,
      image: resolvePreviewAssetUrl(
        canonical,
        readMetaContent(html, 'og:image') ?? readMetaContent(html, 'twitter:image')
      ),
      siteName: readMetaContent(html, 'og:site_name') ?? linkHostname(canonical)
    }
    previewCache.set(canonical, preview)
    return preview
  } catch {
    const fallback: LinkPreviewResponse = {
      url: canonical,
      siteName: linkHostname(canonical),
      title: linkHostname(canonical)
    }
    previewCache.set(canonical, fallback)
    return fallback
  } finally {
    window.clearTimeout(timer)
  }
}
