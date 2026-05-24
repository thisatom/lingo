import { app, session } from 'electron'
import { buildContentSecurityPolicy } from '../../src/shared/config/content-security-policy'

function isRendererNavigation(url: string): boolean {
  if (url.startsWith('app://lingo/')) return true
  if (app.isPackaged) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:') return false
    if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') return false
    return (
      parsed.pathname === '/' ||
      parsed.pathname.endsWith('.html') ||
      parsed.pathname.startsWith('/@') ||
      parsed.pathname.startsWith('/src/')
    )
  } catch {
    return false
  }
}

/**
 * Production: CSP on `app://` via response headers (HTML meta is empty there).
 * Dev: skip — Vite injects CSP into index.html; a session header would block React preamble.
 */
export function setupSessionContentSecurityPolicy(): void {
  if (!app.isPackaged) return

  const policy = buildContentSecurityPolicy('electron-main', 'production')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    if (!isRendererNavigation(details.url)) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }

    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [policy]
    }
    callback({ responseHeaders })
  })
}
