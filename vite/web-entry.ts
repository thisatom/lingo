import { copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

const WEB_HTML = '/index.web.html'

/** Dev/preview: serve the web shell (CSP + `lingo-web` class) at `/`. */
function rewriteRootToWebHtml(): (req: import('http').IncomingMessage, _res: import('http').ServerResponse, next: () => void) => void {
  return (req, _res, next) => {
    const raw = req.url ?? ''
    const q = raw.indexOf('?')
    const pathname = q === -1 ? raw : raw.slice(0, q)
    const query = q === -1 ? '' : raw.slice(q)

    if (pathname === '/' || pathname === '/index.html') {
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
