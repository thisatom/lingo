import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'

function frameRms(samples: Float32Array, start: number, length: number): number {
  let sum = 0
  const end = Math.min(start + length, samples.length)
  const count = Math.max(1, end - start)
  for (let i = start; i < end; i++) {
    const s = samples[i] ?? 0
    sum += s * s
  }
  return Math.sqrt(sum / count)
}

export function measureSpeechRms(samples: Float32Array): number {
  if (samples.length === 0) return 0
  return frameRms(samples, 0, samples.length)
}

/**
 * Trim leading/trailing silence before Whisper. Reduces hallucinations on long
 * recordings where the user spoke briefly then released the mic late.
 */
export function trimSpeechBounds(
  samples: Float32Array,
  sampleRate: number = WHISPER_SAMPLE_RATE,
  options: { paddingMs?: number; minSpeechMs?: number } = {}
): Float32Array {
  if (samples.length === 0) return samples

  const paddingMs = options.paddingMs ?? 180
  const minSpeechMs = options.minSpeechMs ?? 250
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.02))
  const padFrames = Math.max(1, Math.ceil(paddingMs / 20))
  const minKeepFrames = Math.max(1, Math.ceil(minSpeechMs / 20))

  const noiseFloor = estimateNoiseFloor(samples, sampleRate, frameSize)
  const threshold = Math.max(noiseFloor * 3.5, 0.008)

  let startFrame = 0
  let endFrame = Math.ceil(samples.length / frameSize) - 1

  while (startFrame < endFrame && frameRms(samples, startFrame * frameSize, frameSize) < threshold) {
    startFrame++
  }
  while (endFrame > startFrame && frameRms(samples, endFrame * frameSize, frameSize) < threshold) {
    endFrame--
  }

  if (endFrame - startFrame + 1 < minKeepFrames) return samples

  const start = Math.max(0, (startFrame - padFrames) * frameSize)
  const end = Math.min(samples.length, (endFrame + padFrames + 1) * frameSize)
  if (end - start < frameSize * minKeepFrames) return samples
  return samples.slice(start, end)
}

function estimateNoiseFloor(samples: Float32Array, sampleRate: number, frameSize: number): number {
  const frameCount = Math.min(12, Math.floor(samples.length / frameSize))
  if (frameCount === 0) return 0.002

  const rmsValues: number[] = []
  for (let f = 0; f < frameCount; f++) {
    rmsValues.push(frameRms(samples, f * frameSize, frameSize))
  }
  rmsValues.sort((a, b) => a - b)
  const idx = Math.floor(rmsValues.length * 0.15)
  return Math.max(0.001, rmsValues[idx] ?? 0.002)
}

/** Reject clips that are mostly silence/noise after trimming. */
export function hasEnoughSpeechEnergy(
  samples: Float32Array,
  sampleRate: number = WHISPER_SAMPLE_RATE
): boolean {
  if (samples.length < sampleRate * 0.12) return false
  return measureSpeechRms(samples) >= 0.008
}
