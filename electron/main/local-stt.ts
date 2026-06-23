import { decodeWavPcm16ToFloat32 } from '../../src/features/speech-to-text/lib/wav-pcm'
import { STT_PCM_F32_FORMAT } from '../../src/features/speech-to-text/lib/pcm-base64'
import { hasEnoughSpeechEnergy } from '../../src/features/speech-to-text/lib/speech-vad'
import {
  isLikelyGarbledTranscript,
  isLikelyWhisperHallucination,
  isTranscriptSuspiciousForDuration,
  parseWhisperCppBatchTranscription,
  sanitizeWhisperTranscript
} from '../../src/features/speech-to-text/lib/whisper-transcript'
import {
  ensureWhisperModels,
  getWhisperModelPath
} from './whisper-model'
import { runWhisperTranscription, warmWhisperInference } from './whisper-inference'
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

function enqueueStt<T>(fn: () => Promise<T>): Promise<T> {
  const next = transcribeChain.then(fn, fn)
  transcribeChain = next.catch(() => undefined)
  return next
}

function normalizeLanguage(code: string | undefined): string | undefined {
  if (!code?.trim()) return undefined
  return code.trim().split('-')[0].toLowerCase()
}

function decodeSttAudio(bytes: Buffer, format: string): Float32Array {
  if (format === STT_PCM_F32_FORMAT) {
    const sampleCount = Math.floor(bytes.length / 4)
    const out = new Float32Array(sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      out[i] = bytes.readFloatLE(i * 4)
    }
    return out
  }
  if (format === 'wav') {
    return decodeWavPcm16ToFloat32(bytes)
  }
  throw new Error('LOCAL_STT_UNSUPPORTED_FORMAT')
}

function mapSttError(error: unknown): Error {
  if (error instanceof Error) {
    const known = [
      'RECORDING_TOO_SHORT',
      'RECORDING_TOO_LONG',
      'LOCAL_STT_REQUIRES_WAV',
      'LOCAL_STT_UNSUPPORTED_FORMAT',
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
  const transcribe = getWhisperTranscribe()
  await warmWhisperInference(transcribe, getWhisperModelPath())
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

      const language = normalizeLanguage(options.language)
      const audioData = decodeSttAudio(bytes, options.format)

      if (audioData.length > MAX_AUDIO_SAMPLES) throw new Error('RECORDING_TOO_LONG')
      if (audioData.length < 1200 || !hasEnoughSpeechEnergy(audioData, WHISPER_SAMPLE_RATE)) {
        throw new Error('RECORDING_TOO_SHORT')
      }

      console.info(
        '[lingo stt] Transcribe',
        audioData.length,
        'samples',
        language ?? 'auto',
        options.format
      )

      await ensureWhisperModels()
      const transcribe = getWhisperTranscribe()
      const modelPath = getWhisperModelPath()

      const result = await runWhisperTranscription(transcribe, {
        pcmf32: audioData,
        modelPath,
        language
      })

      const parsed = parseWhisperCppBatchTranscription(result.transcription)
      const cleaned = sanitizeWhisperTranscript(parsed)
      if (
        !cleaned ||
        isLikelyGarbledTranscript(cleaned) ||
        isLikelyWhisperHallucination(cleaned) ||
        isTranscriptSuspiciousForDuration(cleaned, audioData.length, WHISPER_SAMPLE_RATE)
      ) {
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
