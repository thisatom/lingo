const DEFAULT_REFERER = 'https://github.com/thisatom/lingo'
const DEFAULT_TITLE = 'Lingo'

function readReferer(): string {
  if (typeof process !== 'undefined' && process.env?.LINGO_APP_URL) {
    return process.env.LINGO_APP_URL
  }
  return DEFAULT_REFERER
}

function readTitle(): string {
  if (typeof process !== 'undefined' && process.env?.LINGO_APP_NAME) {
    return process.env.LINGO_APP_NAME
  }
  return DEFAULT_TITLE
}

export function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': readReferer(),
    'X-Title': readTitle()
  }
}
