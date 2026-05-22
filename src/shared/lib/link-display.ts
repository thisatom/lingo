/** Hostname without leading `www.`. */
export function linkHostname(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./i, '')
  } catch {
    return href
  }
}

function looksLikeUrl(text: string): boolean {
  const t = text.trim()
  return /^https?:\/\//i.test(t) || /^www\./i.test(t) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(t)
}

function childText(children: unknown): string {
  if (typeof children === 'string') return children.trim()
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) {
    return children.map(childText).join('').trim()
  }
  return ''
}

/** Short label for agent-chat links: `domain` or `domain/path…`. */
export function shortenLinkLabel(href: string): string {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./i, '')
    const path = `${url.pathname}${url.search}${url.hash}`
    if (!path || path === '/') return host
    const maxPath = 28
    const compact =
      path.length > maxPath ? `${path.slice(0, maxPath - 1)}…` : path
    return `${host}${compact}`
  } catch {
    return href
  }
}

/** Use domain-style label when markdown text is the raw URL (or empty). */
export function resolveMarkdownLinkLabel(
  href: string | undefined,
  children: unknown
): string | undefined {
  if (!href) return undefined
  const text = childText(children)
  if (!text || text === href.trim() || looksLikeUrl(text)) {
    return shortenLinkLabel(href)
  }
  return text
}

export function normalizeLinkHref(href: string): string {
  try {
    return new URL(href.trim()).href
  } catch {
    return href.trim()
  }
}
