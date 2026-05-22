import type { LinkPreviewResponse } from '../../src/shared/types/ipc'
import { linkHostname } from '../../src/shared/lib/link-display'
import {
  readMetaContent,
  readTitleFromHtml,
  resolvePreviewAssetUrl
} from '../../src/shared/lib/link-preview-parse'

const MAX_HTML_BYTES = 256_000
const FETCH_TIMEOUT_MS = 8_000

const previewCache = new Map<string, LinkPreviewResponse>()

async function readLimitedHtml(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    const text = await response.text()
    return text.slice(0, MAX_HTML_BYTES)
  }

  const decoder = new TextDecoder()
  let html = ''
  let bytes = 0

  while (bytes < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done || !value) break
    bytes += value.byteLength
    html += decoder.decode(value, { stream: true })
    if (bytes >= MAX_HTML_BYTES) break
  }

  reader.cancel().catch(() => undefined)
  return html.slice(0, MAX_HTML_BYTES)
}

function parsePreviewFromHtml(url: string, html: string): LinkPreviewResponse {
  const title =
    readMetaContent(html, 'og:title') ??
    readMetaContent(html, 'twitter:title') ??
    readTitleFromHtml(html) ??
    undefined

  const description =
    readMetaContent(html, 'og:description') ??
    readMetaContent(html, 'twitter:description') ??
    readMetaContent(html, 'description') ??
    undefined

  const image = resolvePreviewAssetUrl(
    url,
    readMetaContent(html, 'og:image') ?? readMetaContent(html, 'twitter:image')
  )

  const siteName = readMetaContent(html, 'og:site_name') ?? linkHostname(url)

  return {
    url,
    title,
    description,
    image,
    siteName
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewResponse> {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('Empty URL')

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) links are supported')
  }

  const canonical = parsed.href
  const cached = previewCache.get(canonical)
  if (cached) return cached

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

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

    const html = await readLimitedHtml(response)
    const preview = parsePreviewFromHtml(canonical, html)
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
    clearTimeout(timeout)
  }
}
