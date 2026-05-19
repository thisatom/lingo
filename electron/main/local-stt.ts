import { join } from 'node:path'
import { app } from 'electron'
import { decodeWavPcm16ToFloat32 } from '../../src/features/speech-to-text/lib/wav-pcm'

/** Better accuracy than tiny; still reasonable on CPU with q8. */
const MODEL_ID = 'Xenova/whisper-small'
const MIN_AUDIO_BYTES = 1000

type AsrPipeline = (
  audio: Float32Array,
  options?: {
    language?: string
    task?: string
    chunk_length_s?: number
    stride_length_s?: number
  }
) => Promise<{ text: string } | string>

let transcriber: AsrPipeline | null = null
let loadPromise: Promise<AsrPipeline> | null = null

async function getTranscriber(): Promise<AsrPipeline> {
  if (transcriber) return transcriber
  if (!loadPromise) {
    loadPromise = (async () => {
      const { env, pipeline } = await import('@huggingface/transformers')
      env.allowLocalModels = false
      env.cacheDir = join(app.getPath('userData'), 'transformers-cache')
      console.info('[lingo stt] Loading Whisper small (first run ~150 MB)…')
      const instance = (await pipeline('automatic-speech-recognition', MODEL_ID, {
        dtype: 'q8'
      })) as AsrPipeline
      transcriber = instance
      console.info('[lingo stt] Whisper ready')
      return instance
    })()
  }
  return loadPromise
}

function normalizeLanguage(code: string | undefined): string | undefined {
  if (!code?.trim()) return undefined
  return code.trim().split('-')[0].toLowerCase()
}

export async function transcribeAudioLocal(options: {
  audioBase64: string
  format: string
  language?: string
}): Promise<string> {
  const bytes = Buffer.from(options.audioBase64, 'base64')
  if (bytes.length < MIN_AUDIO_BYTES) {
    throw new Error('RECORDING_TOO_SHORT')
  }
  if (options.format !== 'wav') {
    throw new Error('LOCAL_STT_REQUIRES_WAV')
  }

  const language = normalizeLanguage(options.language)
  const audioData = decodeWavPcm16ToFloat32(bytes)

  console.info('[lingo stt] Transcribe', audioData.length, 'samples', language ?? 'auto')

  const pipe = await getTranscriber()
  const result = await pipe(audioData, {
    ...(language ? { language } : {}),
    task: 'transcribe',
    chunk_length_s: 30,
    stride_length_s: 5
  })

  const text =
    typeof result === 'string'
      ? result.trim()
      : typeof result === 'object' &&
          result !== null &&
          'text' in result &&
          typeof (result as { text: string }).text === 'string'
        ? (result as { text: string }).text.trim()
        : ''

  if (!text) throw new Error('NO_SPEECH')
  console.info('[lingo stt] OK:', text.slice(0, 80))
  return text
}
