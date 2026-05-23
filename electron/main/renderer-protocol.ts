import { net, protocol } from 'electron'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCHEME = 'app'
const HOST = 'lingo'

/** Must run before `app.whenReady()`. */
export function registerRendererScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
}

function getRendererRoot(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  return path.normalize(path.join(__dirname, '../renderer'))
}

/** Serves `out/renderer` so every HTML entry shares one origin (`app://lingo`). */
export async function setupRendererProtocol(): Promise<void> {
  const root = getRendererRoot()

  protocol.handle(SCHEME, (request) => {
    try {
      const url = new URL(request.url)
      if (url.hostname !== HOST) {
        return new Response('Not found', { status: 404 })
      }

      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '')
      if (!rel || rel.endsWith('/')) rel = 'index.html'

      const filePath = path.normalize(path.join(root, rel))
      if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
        return new Response('Forbidden', { status: 403 })
      }

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('[lingo] app:// request failed:', request.url, error)
      return new Response('Error', { status: 500 })
    }
  })
}

export function packagedRendererUrl(htmlFile: string): string {
  const file = htmlFile.replace(/^\/+/, '')
  return `${SCHEME}://${HOST}/${file}`
}
