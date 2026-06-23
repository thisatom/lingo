import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'

/** Full mel context for anything beyond a quick tap — accuracy over speed. */
export function resolveWhisperAudioCtx(sampleCount: number, sampleRate = WHISPER_SAMPLE_RATE): number {
  const seconds = sampleCount / sampleRate
  if (seconds <= 2) return 512
  return 1500
}
