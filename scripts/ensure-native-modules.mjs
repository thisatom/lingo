/**
 * Native addons (keytar, whisper) must be built for Electron's ABI.
 * Fails when npm install ran with --ignore-scripts or postinstall was skipped.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const required = [
  {
    label: 'keytar',
    file: path.join(rootDir, 'node_modules/keytar/build/Release/keytar.node')
  }
]

const missing = required.filter(({ file }) => !fs.existsSync(file))

if (missing.length === 0) {
  process.exit(0)
}

console.error('[lingo] Missing native modules for Electron:')
for (const { label, file } of missing) {
  console.error(`  - ${label}: ${path.relative(rootDir, file)}`)
}
console.error(
  '\nRebuild them with:\n' +
    '  npm run rebuild:native\n' +
    'or:\n' +
    '  npm run postinstall'
)
process.exit(1)
