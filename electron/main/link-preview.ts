import type { LinkPreviewResponse } from '../../src/shared/types/ipc'

const MAX_HTML_BYTES = 256_000
const FETCH_TIMEOUT_MS = 8_000

const previewCache = new Map<string, LinkPreviewResponse>()

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

function resolvePreviewUrl(baseUrl: string, value: string | null): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value, baseUrl).href
  } catch {
    return undefined
  }
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

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
    readTitle(html) ??
    undefined

  const description =
    readMetaContent(html, 'og:description') ??
    readMetaContent(html, 'twitter:description') ??
    readMetaContent(html, 'description') ??
    undefined

  const image = resolvePreviewUrl(
    url,
    readMetaContent(html, 'og:image') ?? readMetaContent(html, 'twitter:image')
  )

  const siteName =
    readMetaContent(html, 'og:site_name') ?? hostnameFromUrl(url)

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

  const cached = previewCache.get(trimmed)
  if (cached) return cached

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) links are supported')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(parsed.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Lingo/1.0 (link preview)'
      }
    })

    if (!response.ok) {
      throw new Error(`Preview request failed (${response.status})`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      const fallback: LinkPreviewResponse = {
        url: parsed.href,
        siteName: hostnameFromUrl(parsed.href),
        title: hostnameFromUrl(parsed.href)
      }
      previewCache.set(trimmed, fallback)
      return fallback
    }

    const html = await readLimitedHtml(response)
    const preview = parsePreviewFromHtml(parsed.href, html)
    previewCache.set(trimmed, preview)
    return preview
  } finally {
    clearTimeout(timeout)
  }
}
