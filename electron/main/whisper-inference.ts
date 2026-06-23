import { availableParallelism } from 'node:os'
import { resolveWhisperAudioCtx } from '../../src/features/speech-to-text/lib/whisper-audio-ctx'
import type { TranscribeFn } from './whisper-native'

const WARM_SILENCE_SAMPLES = 3200

function sttPrefersGpu(): boolean {
  const flag = process.env.LINGO_STT_USE_GPU?.trim().toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes'
}

function buildTranscribeParams(
  pcmf32: Float32Array,
  modelPath: string,
  language: string | undefined,
  useGpu: boolean
): Record<string, unknown> {
  return {
    pcmf32,
    model: modelPath,
    ...(language ? { language, detect_language: false } : {}),
    translate: false,
    use_gpu: useGpu,
    flash_attn: false,
    no_timestamps: true,
    comma_in_time: false,
    no_prints: true,
    vad: false,
    audio_ctx: resolveWhisperAudioCtx(pcmf32.length),
    n_threads: Math.max(1, availableParallelism())
  }
}

export async function runWhisperTranscription(
  transcribe: TranscribeFn,
  options: {
    pcmf32: Float32Array
    modelPath: string
    language?: string
  }
): Promise<{ transcription: string[][] | string[] }> {
  if (sttPrefersGpu()) {
    try {
      return await transcribe(
        buildTranscribeParams(options.pcmf32, options.modelPath, options.language, true)
      )
    } catch (gpuError) {
      const message = gpuError instanceof Error ? gpuError.message : String(gpuError)
      console.warn('[lingo stt] GPU inference failed, using CPU:', message.slice(0, 120))
    }
  }

  return transcribe(
    buildTranscribeParams(options.pcmf32, options.modelPath, options.language, false)
  )
}

/** Load model weights into memory before the first user recording. */
export async function warmWhisperInference(
  transcribe: TranscribeFn,
  modelPath: string
): Promise<void> {
  const silence = new Float32Array(WARM_SILENCE_SAMPLES)
  try {
    await runWhisperTranscription(transcribe, { pcmf32: silence, modelPath })
  } catch {
    // Warm pass may reject silence — model/context init is what we need.
  }
}
