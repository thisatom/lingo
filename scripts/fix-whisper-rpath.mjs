#!/usr/bin/env node
/**
 * Optional: patch whisper.node RPATH to $ORIGIN so .so files load without LD_LIBRARY_PATH.
 * Requires patchelf (Linux). Safe no-op when unavailable.
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

if (process.platform !== 'linux') process.exit(0)

const nativeDir = path.join(
  root,
  'node_modules',
  '@kutalia/whisper-node-addon',
  'dist',
  `linux-${process.arch}`
)
const nodeFile = path.join(nativeDir, 'whisper.node')

if (!existsSync(nodeFile)) {
  console.info('[lingo] whisper.node not found — skip RPATH patch')
  process.exit(0)
}

try {
  execSync('patchelf --version', { stdio: 'ignore' })
} catch {
  console.info('[lingo] patchelf not installed — STT uses LD_LIBRARY_PATH at worker spawn')
  process.exit(0)
}

try {
  execSync(`patchelf --set-rpath '$ORIGIN' '${nodeFile}'`, { stdio: 'pipe' })
  console.info('[lingo] Patched whisper.node RPATH ($ORIGIN)')
} catch (error) {
  console.warn('[lingo] Could not patch whisper.node RPATH:', error?.message ?? error)
}
