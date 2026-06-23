import { availableParallelism } from 'node:os'
import { decodeWavPcm16ToFloat32 } from '../../src/features/speech-to-text/lib/wav-pcm'
import { hasEnoughSpeechEnergy } from '../../src/features/speech-to-text/lib/speech-vad'
import {
  isLikelyWhisperHallucination,
  parseWhisperCppTranscription,
  sanitizeWhisperTranscript,
  stripCumulativeWhisperTranscript
} from '../../src/features/speech-to-text/lib/whisper-transcript'
import {
  ensureWhisperModels,
  getWhisperModelPath
} from './whisper-model'
import { getWhisperTranscribe } from './whisper-native'

export {
  configureLocalStt,
  defaultTransformersCacheDir,
  defaultWhisperModelsDir
} from './whisper-model'

const MIN_AUDIO_BYTES = 1000
const MAX_AUDIO_SAMPLES = 16_000 * 120
const WHISPER_SAMPLE_RATE = 16_000

let transcribeChain: Promise<unknown> = Promise.resolve()
/** Previous raw whisper output in this worker — realtime mode may prepend it to the next clip. */
let previousWhisperTranscript = ''

function enqueueStt<T>(fn: () => Promise<T>): Promise<T> {
  const next = transcribeChain.then(fn, fn)
  transcribeChain = next.catch(() => undefined)
  return next
}

function normalizeLanguage(code: string | undefined): string | undefined {
  if (!code?.trim()) return undefined
  return code.trim().split('-')[0].toLowerCase()
}

function mapSttError(error: unknown): Error {
  if (error instanceof Error) {
    const known = [
      'RECORDING_TOO_SHORT',
      'RECORDING_TOO_LONG',
      'LOCAL_STT_REQUIRES_WAV',
      'INVALID_WAV',
      'UNSUPPORTED_WAV_ENCODING',
      'UNSUPPORTED_SAMPLE_RATE',
      'NO_SPEECH',
      'STT_MODEL_LOAD_FAILED',
      'STT_INFERENCE_FAILED',
      'STT_NOT_CONFIGURED',
      'STT_UNSUPPORTED_PLATFORM'
    ]
    if (known.some((code) => error.message.includes(code))) return error
    if (error.message.includes('Model path is required') || error.message.includes('fetch')) {
      return new Error('STT_MODEL_LOAD_FAILED')
    }
    if (error.message.includes('Failed to load native addon')) {
      return new Error('STT_INFERENCE_FAILED:native_addon')
    }
    return new Error(`STT_INFERENCE_FAILED: ${error.message.slice(0, 200)}`)
  }
  return new Error('STT_INFERENCE_FAILED')
}

export async function warmLocalSttModel(): Promise<void> {
  await ensureWhisperModels()
  getWhisperTranscribe()
}

export async function transcribeAudioLocal(options: {
  audioBase64: string
  format: string
  language?: string
}): Promise<string> {
  return enqueueStt(async () => {
    try {
      const bytes = Buffer.from(options.audioBase64, 'base64')
      if (bytes.length < MIN_AUDIO_BYTES) throw new Error('RECORDING_TOO_SHORT')
      if (options.format !== 'wav') throw new Error('LOCAL_STT_REQUIRES_WAV')

      const language = normalizeLanguage(options.language)
      const audioData = decodeWavPcm16ToFloat32(bytes)

      if (audioData.length > MAX_AUDIO_SAMPLES) throw new Error('RECORDING_TOO_LONG')
      if (audioData.length < 1200 || !hasEnoughSpeechEnergy(audioData, WHISPER_SAMPLE_RATE)) {
        throw new Error('RECORDING_TOO_SHORT')
      }

      console.info(
        '[lingo stt] Transcribe',
        audioData.length,
        'samples',
        language ?? 'auto'
      )

      await ensureWhisperModels()
      const transcribe = getWhisperTranscribe()

      const modelPath = getWhisperModelPath()

      const result = await transcribe({
        pcmf32: audioData,
        model: modelPath,
        ...(language ? { language, detect_language: false } : {}),
        translate: false,
        use_gpu: false,
        no_timestamps: true,
        comma_in_time: false,
        no_prints: true,
        // Audio is already trimmed/normalized in renderer — internal VAD drops short phrases.
        vad: false,
        n_threads: Math.max(1, availableParallelism() - 1)
      })

      const parsed = parseWhisperCppTranscription(result.transcription)
      const withoutCarryOver = stripCumulativeWhisperTranscript(previousWhisperTranscript, parsed)
      previousWhisperTranscript = parsed

      const cleaned = sanitizeWhisperTranscript(withoutCarryOver)
      if (!cleaned || isLikelyWhisperHallucination(cleaned)) {
        throw new Error('NO_SPEECH')
      }

      console.info('[lingo stt] OK:', cleaned.slice(0, 80))
      return cleaned
    } catch (error) {
      const mapped = mapSttError(error)
      console.warn('[lingo stt] Failed:', mapped.message)
      throw mapped
    }
  })
}
