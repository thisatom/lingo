import { session } from 'electron'
import type { OnHeadersReceivedListenerDetails } from 'electron'
import {
  buildContentSecurityPolicy,
  type CspMode
} from '@/shared/config/content-security-policy'

const DEV_RENDERER_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

function rendererCspMode(isPackaged: boolean): CspMode {
  return isPackaged ? 'production' : 'development'
}

function isRendererDocument(details: OnHeadersReceivedListenerDetails): boolean {
  if (details.resourceType !== 'mainFrame') return false

  const url = details.url
  if (url.startsWith('file:')) {
    return /index\.html(?:$|[?#])/i.test(url)
  }

  try {
    const parsed = new URL(url)
    if (!DEV_RENDERER_HOSTS.has(parsed.hostname)) return false
    return parsed.pathname === '/' || parsed.pathname === '/index.html'
  } catch {
    return false
  }
}

/** Enforce renderer CSP via HTTP headers (meta tag is still injected at build/dev time). */
export function setupRendererContentSecurityPolicy(isPackaged: boolean): void {
  const mode = rendererCspMode(isPackaged)
  const policy = buildContentSecurityPolicy('electron-main', mode, { viteHmr: false })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!isRendererDocument(details)) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy]
      }
    })
  })
}
