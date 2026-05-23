export type OutboundUrlPolicy = {
  /** Allow loopback and private network targets (user-configured custom LLM only). */
  allowPrivateNetwork?: boolean
}

export class OutboundUrlBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OutboundUrlBlockedError'
  }
}

function isIpv4PrivateOrReserved(host: string): boolean {
  const parts = host.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false
  }
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host.endsWith('.local') || host.endsWith('.internal')) return true
  if (host === '0.0.0.0' || host === '::' || host === '::1') return true
  if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true
  if (isIpv4PrivateOrReserved(host)) return true
  return false
}

/** Validate http(s) URL before main-process or trusted fetches. */
export function assertOutboundHttpUrl(url: string, policy: OutboundUrlPolicy = {}): URL {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw new OutboundUrlBlockedError('Invalid URL.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new OutboundUrlBlockedError('Only HTTP(S) URLs are allowed.')
  }

  if (parsed.username || parsed.password) {
    throw new OutboundUrlBlockedError('URLs with credentials are not allowed.')
  }

  if (!policy.allowPrivateNetwork && isBlockedHostname(parsed.hostname)) {
    throw new OutboundUrlBlockedError('Private or local network URLs are not allowed.')
  }

  return parsed
}

const DEFAULT_MAX_REDIRECTS = 5

export type SafeFetchInit = RequestInit & {
  maxRedirects?: number
}

/** Fetch with per-hop URL validation (blocks private-network redirects). */
export async function fetchWithOutboundPolicy(
  url: string,
  init: SafeFetchInit = {},
  policy: OutboundUrlPolicy = {}
): Promise<Response> {
  const maxRedirects = init.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  let current = assertOutboundHttpUrl(url, policy).href

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await fetch(current, { ...init, redirect: 'manual' })
    if (response.status < 300 || response.status >= 400) {
      return response
    }

    const location = response.headers.get('location')
    if (!location) return response

    if (hop >= maxRedirects) {
      throw new OutboundUrlBlockedError('Too many redirects.')
    }

    current = assertOutboundHttpUrl(new URL(location, current).href, policy).href
  }

  throw new OutboundUrlBlockedError('Too many redirects.')
}
