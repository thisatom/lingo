import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Cursor/sandbox sometimes sets this; Electron then runs as plain Node and main crashes. */
delete process.env.ELECTRON_RUN_AS_NODE

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('[lingo] Usage: node scripts/electron-vite-run.mjs <electron-vite-args…>')
  process.exit(1)
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electronVite = path.join(rootDir, 'node_modules', '.bin', 'electron-vite')

const result = spawnSync(electronVite, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
  cwd: rootDir
})

if (result.error) {
  console.error('[lingo] Failed to start electron-vite:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
