import { createWriteStream } from 'node:fs'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fetch } from 'undici'

const WHISPER_HF_BASE = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main'
const VAD_HF_BASE = 'https://huggingface.co/ggml-org/whisper-vad/resolve/main'

/** Quantized small — multilingual, ~181 MB download. */
export const WHISPER_MODEL_FILE = 'ggml-small-q5_1.bin'
export const WHISPER_VAD_MODEL_FILE = 'ggml-silero-v6.2.0.bin'

const MODEL_SPECS = [
  {
    fileName: WHISPER_MODEL_FILE,
    label: 'Whisper small (q5_1)',
    url: `${WHISPER_HF_BASE}/${WHISPER_MODEL_FILE}`,
    minBytes: 100_000_000
  },
  {
    fileName: WHISPER_VAD_MODEL_FILE,
    label: 'Silero VAD',
    url: `${VAD_HF_BASE}/${WHISPER_VAD_MODEL_FILE}`,
    minBytes: 500_000
  }
] as const

let modelsDir: string | null = null
let ensurePromise: Promise<void> | null = null

export function configureWhisperModelsDir(dir: string): void {
  modelsDir = dir
  ensurePromise = null
}

export function defaultWhisperModelsDir(userDataPath: string): string {
  return join(userDataPath, 'whisper-models')
}

function resolveModelsDir(): string {
  if (!modelsDir?.trim()) throw new Error('STT_NOT_CONFIGURED')
  return modelsDir
}

export function getWhisperModelPath(): string {
  return join(resolveModelsDir(), WHISPER_MODEL_FILE)
}

export function getWhisperVadModelPath(): string {
  return join(resolveModelsDir(), WHISPER_VAD_MODEL_FILE)
}

async function fileSize(filePath: string): Promise<number | null> {
  try {
    const info = await stat(filePath)
    return info.isFile() ? info.size : null
  } catch {
    return null
  }
}

async function isValidModelFile(filePath: string, minBytes: number): Promise<boolean> {
  const size = await fileSize(filePath)
  return size !== null && size >= minBytes
}

async function downloadFile(
  url: string,
  destination: string,
  label: string,
  minBytes: number
): Promise<void> {
  console.info(`[lingo stt] Downloading ${label}…`)
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok || !response.body) {
    throw new Error(`STT_MODEL_LOAD_FAILED:${response.status}`)
  }

  const total = Number(response.headers.get('content-length') ?? 0)
  let downloaded = 0
  let lastLogged = 0

  const reader = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
  reader.on('data', (chunk: Buffer) => {
    downloaded += chunk.length
    if (total > 0) {
      const pct = Math.floor((downloaded / total) * 100)
      if (pct >= lastLogged + 10) {
        lastLogged = pct
        console.info(`[lingo stt] ${label}: ${pct}%`)
      }
    }
  })

  try {
    await pipeline(reader, createWriteStream(destination))
  } catch (error) {
    await unlink(destination).catch(() => undefined)
    throw error
  }

  if (!(await isValidModelFile(destination, minBytes))) {
    await unlink(destination).catch(() => undefined)
    throw new Error('STT_MODEL_LOAD_FAILED:invalid_file')
  }

  console.info(`[lingo stt] ${label} ready`)
}

async function ensureModelFile(spec: (typeof MODEL_SPECS)[number]): Promise<void> {
  const dir = resolveModelsDir()
  await mkdir(dir, { recursive: true })
  const destination = join(dir, spec.fileName)

  if (await isValidModelFile(destination, spec.minBytes)) return

  await unlink(destination).catch(() => undefined)
  await downloadFile(spec.url, destination, spec.label, spec.minBytes)
}

export async function ensureWhisperModels(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      for (const spec of MODEL_SPECS) {
        await ensureModelFile(spec)
      }
    })().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  return ensurePromise
}

/** @deprecated alias for worker init IPC */
export function defaultTransformersCacheDir(userDataPath: string): string {
  return defaultWhisperModelsDir(userDataPath)
}

export function configureLocalStt(options: { cacheDir: string }): void {
  configureWhisperModelsDir(options.cacheDir)
}
