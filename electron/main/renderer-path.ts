import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Packaged renderer HTML under `out/renderer/` (asar-safe for `loadFile`). */
export function resolvePackagedRendererHtml(htmlFile = 'index.html'): string {
  const file = htmlFile.replace(/^\/+/, '')
  return path.join(__dirname, '../renderer', file)
}
