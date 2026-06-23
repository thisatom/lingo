/**
 * Runs before stt-worker.js in the forked child (via node --require).
 * Linux dynamic linker reads LD_LIBRARY_PATH at process start — setting it
 * later in JS is unreliable under Electron.
 */
const path = require('node:path')

function prependPathEnv(key, dir) {
  if (!dir) return
  const sep = path.delimiter
  const parts = (process.env[key] ?? '').split(sep).filter(Boolean)
  if (parts.includes(dir)) return
  process.env[key] = `${dir}${parts.length ? sep + parts.join(sep) : ''}`
}

const nativeDir = process.env.LINGO_WHISPER_NATIVE_DIR
if (nativeDir) {
  if (process.platform === 'linux') prependPathEnv('LD_LIBRARY_PATH', nativeDir)
  if (process.platform === 'darwin') prependPathEnv('DYLD_LIBRARY_PATH', nativeDir)
}
