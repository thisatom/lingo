import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function resolvePreloadScript(): string {
  const dir = path.join(__dirname, '../preload')
  for (const file of ['index.cjs', 'index.js', 'index.mjs']) {
    const full = path.join(dir, file)
    if (existsSync(full)) return full
  }
  throw new Error(`Preload script not found in ${dir}. Run npm run dev or npm run build.`)
}
