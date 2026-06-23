import { fork, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'
import { defaultWhisperModelsDir } from './whisper-model'
import {
  buildWhisperWorkerEnv,
  resolveSttWorkerPreloadPath,
  resolveWhisperNativeDir
} from './whisper-native'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type WorkerInMessage =
  | { type: 'init'; cacheDir: string }
  | { type: 'warm' }
  | {
      type: 'transcribe'
      id: string
      audioBase64: string
      format: string
      language?: string
    }

type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'warm-done' }
  | { type: 'result'; id: string; ok: true; text: string }
  | { type: 'result'; id: string; ok: false; error: string }

type PendingJob = {
  resolve: (text: string) => void
  reject: (error: Error) => void
}

let worker: ChildProcess | null = null
let readyPromise: Promise<void> | null = null
const pending = new Map<string, PendingJob>()
let transcribeChain: Promise<unknown> = Promise.resolve()

function workerScriptPath(): string {
  return path.join(__dirname, 'stt-worker.js')
}

function rejectAllPending(error: Error): void {
  for (const job of pending.values()) {
    job.reject(error)
  }
  pending.clear()
}

function handleWorkerMessage(message: WorkerOutMessage): void {
  if (message.type === 'ready' || message.type === 'warm-done') return

  const job = pending.get(message.id)
  if (!job) return
  pending.delete(message.id)

  if (message.ok) job.resolve(message.text)
  else job.reject(new Error(message.error))
}

function attachWorkerHandlers(child: ChildProcess): void {
  child.on('message', (message: WorkerOutMessage) => {
    handleWorkerMessage(message)
  })

  child.on('exit', (code, signal) => {
    console.warn('[lingo stt] Worker exited', { code, signal })
    if (worker === child) worker = null
    readyPromise = null
    rejectAllPending(new Error('STT_WORKER_CRASHED'))
  })

  child.stdout?.on('data', (chunk) => {
    const line = chunk.toString().trim()
    if (line) console.info('[lingo stt worker]', line)
  })

  child.stderr?.on('data', (chunk) => {
    const line = chunk.toString().trim()
    if (line) console.warn('[lingo stt worker]', line)
  })
}

function spawnWorker(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = new Promise((resolve, reject) => {
    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    const nativeDir = resolveWhisperNativeDir()
    const preloadPath = resolveSttWorkerPreloadPath(__dirname)
    const execArgv: string[] = []
    if (existsSync(preloadPath)) {
      execArgv.push('--require', preloadPath)
    }

    const child = fork(workerScriptPath(), [], {
      execPath: process.execPath,
      env: buildWhisperWorkerEnv(nativeDir),
      execArgv,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })
    worker = child
    attachWorkerHandlers(child)

    console.info('[lingo stt] Worker spawn', { nativeDir, preload: preloadPath })

    const onEarlyExit = (code: number | null) => {
      finish(() => {
        readyPromise = null
        reject(new Error(`STT_WORKER_CRASHED:init:${code ?? 'signal'}`))
      })
    }

    child.once('exit', onEarlyExit)

    const onReady = (message: WorkerOutMessage) => {
      if (message.type !== 'ready') return
      child.off('message', onReady)
      child.off('exit', onEarlyExit)
      finish(() => resolve())
    }

    child.on('message', onReady)
    child.once('error', (error) => {
      child.off('message', onReady)
      child.off('exit', onEarlyExit)
      finish(() => {
        readyPromise = null
        reject(error instanceof Error ? error : new Error('STT_WORKER_CRASHED'))
      })
    })

    child.send({
      type: 'init',
      cacheDir: defaultWhisperModelsDir(app.getPath('userData'))
    } satisfies WorkerInMessage)
  })

  return readyPromise
}

function sendToWorker(message: WorkerInMessage): void {
  if (!worker?.connected) {
    throw new Error('STT_WORKER_CRASHED')
  }
  worker.send(message)
}

function enqueueHost<T>(fn: () => Promise<T>): Promise<T> {
  const next = transcribeChain.then(fn, fn)
  transcribeChain = next.catch(() => undefined)
  return next
}

export function warmSttWorker(): void {
  void enqueueHost(async () => {
    await spawnWorker()
    sendToWorker({ type: 'warm' })
  }).catch((error) => {
    console.warn('[lingo stt] Warm worker failed:', error)
  })
}

export async function transcribeInWorker(options: {
  audioBase64: string
  format: string
  language?: string
}): Promise<string> {
  return enqueueHost(async () => {
    await spawnWorker()

    return new Promise<string>((resolve, reject) => {
      const id = randomUUID()
      pending.set(id, { resolve, reject })

      try {
        sendToWorker({ type: 'transcribe', id, ...options })
      } catch (error) {
        pending.delete(id)
        reject(error instanceof Error ? error : new Error('STT_WORKER_CRASHED'))
      }
    })
  })
}

export async function shutdownSttWorker(): Promise<void> {
  if (!worker) return
  const child = worker
  worker = null
  readyPromise = null
  rejectAllPending(new Error('STT_WORKER_SHUTDOWN'))
  child.removeAllListeners()
  child.kill('SIGTERM')
}
