import { copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

const WEB_HTML = '/index.web.html'

/** Vite asset / module paths must not be rewritten to the web HTML shell. */
export function shouldRewritePathToWebHtml(pathname: string): boolean {
  if (!pathname || pathname === WEB_HTML) return false
  if (pathname.startsWith('/@vite') || pathname.startsWith('/@fs') || pathname.startsWith('/@id')) {
    return false
  }
  if (pathname.startsWith('/src/') || pathname.startsWith('/node_modules/')) return false
  if (pathname !== '/index.html' && /\.[a-zA-Z0-9]+$/.test(pathname)) return false
  return true
}

/** Dev/preview: serve the web shell (CSP + `lingo-web` class) for all SPA routes. */
function rewriteRootToWebHtml(): (req: import('http').IncomingMessage, _res: import('http').ServerResponse, next: () => void) => void {
  return (req, _res, next) => {
    const raw = req.url ?? ''
    const q = raw.indexOf('?')
    const pathname = q === -1 ? raw : raw.slice(0, q)
    const query = q === -1 ? '' : raw.slice(q)

    if (shouldRewritePathToWebHtml(pathname)) {
      req.url = WEB_HTML + query
    }
    next()
  }
}

export function webEntryPlugin(rootDir: string): Plugin {
  const outDir = resolve(rootDir, 'dist-web')
  const webHtml = join(outDir, 'index.web.html')
  const rootHtml = join(outDir, 'index.html')

  return {
    name: 'lingo-web-entry',
    configureServer(server) {
      server.middlewares.use(rewriteRootToWebHtml())
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteRootToWebHtml())
    },
    closeBundle() {
      if (!existsSync(webHtml)) return
      copyFileSync(webHtml, rootHtml)
    }
  }
}
