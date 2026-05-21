import type { LinkPreviewResponse } from '@/shared/types/ipc'

const previewCache = new Map<string, LinkPreviewResponse>()
const MAX_HTML_BYTES = 256_000
const FETCH_TIMEOUT_MS = 8_000

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
}

function readMetaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      'i'
    )
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1].trim())
  }
  return null
}

function readTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null
}

export async function fetchWebLinkPreview(url: string): Promise<LinkPreviewResponse> {
  const cached = previewCache.get(url)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html' }
    })
    if (!response.ok) {
      return { url }
    }

    const reader = response.body?.getReader()
    if (!reader) return { url }

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
      url,
      title:
        readMetaContent(html, 'og:title') ??
        readMetaContent(html, 'twitter:title') ??
        readTitle(html) ??
        undefined,
      description:
        readMetaContent(html, 'og:description') ??
        readMetaContent(html, 'twitter:description') ??
        readMetaContent(html, 'description') ??
        undefined,
      image:
        readMetaContent(html, 'og:image') ??
        readMetaContent(html, 'twitter:image') ??
        undefined,
      siteName: readMetaContent(html, 'og:site_name') ?? undefined
    }
    previewCache.set(url, preview)
    return preview
  } catch {
    return { url }
  } finally {
    window.clearTimeout(timer)
  }
}
