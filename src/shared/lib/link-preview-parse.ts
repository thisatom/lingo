export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
}

export function readMetaContent(html: string, key: string): string | null {
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

export function readTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null
}

export function resolvePreviewAssetUrl(
  baseUrl: string,
  value: string | null
): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value, baseUrl).href
  } catch {
    return undefined
  }
}
