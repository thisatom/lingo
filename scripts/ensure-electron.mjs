/**
 * electron-vite needs node_modules/electron/path.txt and dist/.
 * On some Linux setups (pnpm, --ignore-scripts, failed download) postinstall is skipped.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

let electronDir
try {
  electronDir = path.dirname(require.resolve('electron/package.json'))
} catch {
  console.warn('[lingo] electron package not found — run npm install')
  process.exit(0)
}

const pathFile = path.join(electronDir, 'path.txt')
const distDir = path.join(electronDir, 'dist')

function electronReady() {
  if (!fs.existsSync(pathFile)) return false
  const rel = fs.readFileSync(pathFile, 'utf8').trim()
  if (!rel) return false
  return fs.existsSync(path.join(distDir, rel))
}

if (electronReady()) {
  process.exit(0)
}

console.log('[lingo] Electron binary missing — running install.js …')

const result = spawnSync(process.execPath, ['install.js'], {
  cwd: electronDir,
  stdio: 'inherit',
  env: process.env
})

if (result.status !== 0) {
  console.error(
    '[lingo] Electron install failed. Check network/proxy, then run:\n' +
      `  cd "${electronDir}" && node install.js`
  )
  process.exit(result.status ?? 1)
}

if (!electronReady()) {
  console.error('[lingo] Electron install finished but path.txt/dist is still missing.')
  process.exit(1)
}
