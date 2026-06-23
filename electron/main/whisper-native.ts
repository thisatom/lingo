import { createRequire } from 'node:module'
import { accessSync, constants } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)

type WhisperTranscribeOptions = Record<string, unknown> & {
  pcmf32?: Float32Array
  fname_inp?: string
  model: string
}

export type TranscribeFn = (options: WhisperTranscribeOptions) => Promise<{
  transcription: string[][] | string[]
}>

let transcribeFn: TranscribeFn | null = null

function platformArchDir(): string {
  const platform =
    process.platform === 'darwin'
      ? 'darwin'
      : process.platform === 'win32'
        ? 'win32'
        : process.platform === 'linux'
          ? 'linux'
          : null
  if (!platform) {
    throw new Error(`STT_UNSUPPORTED_PLATFORM:${process.platform}`)
  }
  return `${platform}-${process.arch}`
}

function isPackagedApp(): boolean {
  if (process.env.ELECTRON_RUN_AS_NODE === '1') {
    return Boolean(process.resourcesPath && process.env.NODE_ENV === 'production')
  }
  try {
    const { app } = require('electron') as typeof import('electron')
    return app.isPackaged
  } catch {
    return false
  }
}

export function resolveWhisperNativeDir(): string {
  const pkgRoot = path.dirname(
    require.resolve('@kutalia/whisper-node-addon/package.json')
  )
  const rel = path.join('dist', platformArchDir())

  if (isPackagedApp() && process.resourcesPath) {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '@kutalia/whisper-node-addon',
      rel
    )
  }

  return path.join(pkgRoot, rel)
}

function libraryPathEnvKey(): 'LD_LIBRARY_PATH' | 'DYLD_LIBRARY_PATH' | null {
  if (process.platform === 'linux') return 'LD_LIBRARY_PATH'
  if (process.platform === 'darwin') return 'DYLD_LIBRARY_PATH'
  return null
}

function prependEnvPath(key: string, dir: string): void {
  const sep = path.delimiter
  const parts = (process.env[key] ?? '').split(sep).filter(Boolean)
  if (parts.includes(dir)) return
  process.env[key] = `${dir}${parts.length ? sep + parts.join(sep) : ''}`
}

/** Apply native library search path in the current process (best-effort). */
export function ensureWhisperNativeEnv(nativeDir = resolveWhisperNativeDir()): string {
  const key = libraryPathEnvKey()
  if (key) prependEnvPath(key, nativeDir)
  process.env.LINGO_WHISPER_NATIVE_DIR = nativeDir
  return nativeDir
}

/** Environment for forked STT worker — LD_LIBRARY_PATH must exist before child starts. */
export function buildWhisperWorkerEnv(
  nativeDir = resolveWhisperNativeDir()
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    LINGO_WHISPER_NATIVE_DIR: nativeDir
  }

  const key = libraryPathEnvKey()
  if (key) {
    const sep = path.delimiter
    const parts = (env[key] ?? '').split(sep).filter(Boolean)
    if (!parts.includes(nativeDir)) parts.unshift(nativeDir)
    env[key] = parts.join(sep)
  }

  return env
}

export function resolveSttWorkerPreloadPath(workerDir: string): string {
  return path.join(workerDir, 'stt-worker-preload.cjs')
}

function assertNativeBundle(nativeDir: string): void {
  const addonPath = path.join(nativeDir, 'whisper.node')
  try {
    accessSync(addonPath, constants.R_OK)
  } catch {
    throw new Error(`STT_INFERENCE_FAILED:missing_addon:${addonPath}`)
  }

  if (process.platform === 'linux') {
    try {
      accessSync(path.join(nativeDir, 'libwhisper.so.1'), constants.R_OK)
    } catch {
      throw new Error(`STT_INFERENCE_FAILED:missing_libwhisper:${nativeDir}`)
    }
  }
}

export function verifyWhisperNativeLoad(): void {
  getWhisperTranscribe()
}

export function getWhisperTranscribe(): TranscribeFn {
  if (transcribeFn) return transcribeFn

  const nativeDir = ensureWhisperNativeEnv()
  assertNativeBundle(nativeDir)

  const addonPath = path.join(nativeDir, 'whisper.node')
  let whisper: (
    options: WhisperTranscribeOptions,
    callback: (error: Error | null, result: { transcription: string[][] | string[] }) => void
  ) => void

  try {
    ;({ whisper } = require(addonPath) as {
      whisper: typeof whisper
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('libwhisper.so')) {
      throw new Error(
        'STT_INFERENCE_FAILED:native_libs — whisper shared libraries not found; restart the app after npm install'
      )
    }
    throw new Error(`STT_INFERENCE_FAILED:native_addon:${msg.slice(0, 160)}`)
  }

  transcribeFn = (options) =>
    new Promise((resolve, reject) => {
      whisper(options, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })

  return transcribeFn
}
