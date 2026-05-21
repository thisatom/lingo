const BLOCK_END =
  /<\/(?:p|div|h[1-6]|li|tr|td|th|section|article|blockquote|pre|figcaption|header|footer)>/gi

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_END, '\n')
    .replace(/<[^>]+>/g, ' ')
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function pickMainHtml(html: string): string {
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+role=["']main["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+id=["']content["'][^>]*>([\s\S]*?)<\/div>/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1] && match[1].replace(/<[^>]+>/g, '').trim().length > 120) {
      return match[1]
    }
  }

  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  return body?.[1] ?? html
}

/** Rough HTML → readable plain text (no extra dependencies). */
export function extractTextFromHtml(html: string, maxChars = 4000): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  const main = pickMainHtml(withoutNoise)
  const text = normalizeWhitespace(decodeHtmlEntities(stripTags(main)))

  if (text.length <= maxChars) return text
  const cut = text.slice(0, maxChars)
  const lastBreak = cut.lastIndexOf('\n\n')
  return (lastBreak > maxChars * 0.6 ? cut.slice(0, lastBreak) : cut).trim() + '…'
}
