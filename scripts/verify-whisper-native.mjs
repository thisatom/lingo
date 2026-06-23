#!/usr/bin/env node
/** Smoke test: fork STT worker with production env/preload and run warm. */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { fork } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const workerJs = path.join(root, 'out', 'main', 'stt-worker.js')
const preload = path.join(root, 'out', 'main', 'stt-worker-preload.cjs')
const nativeDir = path.join(
  root,
  'node_modules',
  '@kutalia/whisper-node-addon',
  'dist',
  `linux-${process.arch}`
)

if (!existsSync(workerJs)) {
  console.error('[verify-whisper] Run npm run build first (missing out/main/stt-worker.js)')
  process.exit(1)
}

const modelsDir =
  process.env.LINGO_WHISPER_MODELS_DIR ??
  path.join(process.env.HOME ?? '/tmp', '.config', 'lingo', 'whisper-models')

const ldPath = [nativeDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')
const execArgv = existsSync(preload) ? ['--require', preload] : []
const execPath = process.env.LINGO_STT_WORKER_NODE ?? require('electron')

const child = fork(workerJs, [], {
  execPath,
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    LINGO_WHISPER_NATIVE_DIR: nativeDir,
    LD_LIBRARY_PATH: ldPath
  },
  execArgv,
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
})

child.stdout?.on('data', (d) => process.stdout.write(d))
child.stderr?.on('data', (d) => process.stderr.write(d))

let warmOk = false

child.on('message', (msg) => {
  if (msg?.type === 'ready') child.send({ type: 'warm' })
  if (msg?.type === 'warm-done') {
    warmOk = true
    console.info('[verify-whisper] warm OK')
    child.kill()
  }
})

child.on('exit', (code) => {
  if (warmOk && (code === 0 || code === null)) {
    console.info('[verify-whisper] success')
    process.exit(0)
  }
  console.error('[verify-whisper] worker exit before warm', { code, warmOk })
  process.exit(code && code !== 0 ? code : 1)
})

child.send({ type: 'init', cacheDir: modelsDir })

setTimeout(() => {
  console.error('[verify-whisper] timeout')
  child.kill()
  process.exit(1)
}, 120_000)
