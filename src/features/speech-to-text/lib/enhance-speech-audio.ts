import type { MicNoiseSuppression } from './mic-noise-suppression'
import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'

const TARGET_RMS = 0.1
const MAX_GAIN = 8

export interface EnhanceSpeechOptions {
  level?: MicNoiseSuppression
}

/**
 * Speech preprocessing before Whisper. Strength is user-configurable;
 * default "light" avoids cutting quiet syllables or pauses between words.
 */
export function enhanceSpeechAudio(
  input: Float32Array,
  sampleRate: number = WHISPER_SAMPLE_RATE,
  options: EnhanceSpeechOptions = {}
): Float32Array {
  const level = options.level ?? 'light'
  if (input.length === 0 || level === 'off') {
    return normalizeRmsOnly(input, TARGET_RMS, MAX_GAIN)
  }

  let samples = highPassFilter(input, sampleRate, 80)

  if (level === 'light') {
    return normalizeRms(samples, TARGET_RMS, MAX_GAIN)
  }

  samples = preEmphasis(samples, 0.97)
  const noiseFloor = estimateNoiseFloor(samples, sampleRate)

  if (level === 'medium' || level === 'strong') {
    samples = softNoiseGate(samples, sampleRate, noiseFloor, level)
  }

  if (level === 'strong') {
    samples = speechPresenceEq(samples, sampleRate)
  }

  samples = normalizeRms(samples, TARGET_RMS, MAX_GAIN)

  if (level === 'strong') {
    samples = trimSilenceEdges(samples, sampleRate, noiseFloor, 'strong')
  } else if (level === 'medium') {
    samples = trimSilenceEdges(samples, sampleRate, noiseFloor, 'medium')
  }

  return samples
}

function normalizeRmsOnly(
  samples: Float32Array,
  targetRms: number,
  maxGain: number
): Float32Array {
  if (samples.length === 0) return samples
  return normalizeRms(samples, targetRms, maxGain)
}

function highPassFilter(
  input: Float32Array,
  sampleRate: number,
  cutoffHz: number
): Float32Array {
  const output = new Float32Array(input.length)
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate
  const cos = Math.cos(w0)
  const sin = Math.sin(w0)
  const Q = 0.707
  const alpha = sin / (2 * Q)
  const b0 = (1 + cos) / 2
  const b1 = -(1 + cos)
  const b2 = (1 + cos) / 2
  const a0 = 1 + alpha
  const b0n = b0 / a0
  const b1n = b1 / a0
  const b2n = b2 / a0
  const a1n = (-2 * cos) / a0
  const a2n = (1 - alpha) / a0

  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i]!
    const y0 = b0n * x0 + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2
    output[i] = y0
    x2 = x1
    x1 = x0
    y2 = y1
    y1 = y0
  }
  return output
}

function preEmphasis(input: Float32Array, coef: number): Float32Array {
  const output = new Float32Array(input.length)
  output[0] = input[0] ?? 0
  for (let i = 1; i < input.length; i++) {
    output[i] = (input[i] ?? 0) - coef * (input[i - 1] ?? 0)
  }
  return output
}

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

function estimateNoiseFloor(samples: Float32Array, sampleRate: number): number {
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.025))
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

function softNoiseGate(
  samples: Float32Array,
  sampleRate: number,
  noiseFloor: number,
  level: 'medium' | 'strong'
): Float32Array {
  const output = new Float32Array(samples.length)
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.02))
  const threshold = noiseFloor * (level === 'medium' ? 4.5 : 3.2)
  const minGain = level === 'medium' ? 0.45 : 0.22

  for (let i = 0; i < samples.length; i += frameSize) {
    const rms = frameRms(samples, i, frameSize)
    let gain = 1
    if (rms < threshold) {
      const t = Math.min(1, rms / threshold)
      gain = minGain + (1 - minGain) * t * t * t
    }
    const end = Math.min(i + frameSize, samples.length)
    for (let j = i; j < end; j++) {
      output[j] = (samples[j] ?? 0) * gain
    }
  }
  return output
}

function speechPresenceEq(samples: Float32Array, sampleRate: number): Float32Array {
  const output = new Float32Array(samples.length)
  const freq = 3000
  const gainDb = 2
  const Q = 1.2
  const A = 10 ** (gainDb / 40)
  const w0 = (2 * Math.PI * freq) / sampleRate
  const cos = Math.cos(w0)
  const sin = Math.sin(w0)
  const alpha = sin / (2 * Q)
  const b0 = 1 + alpha * A
  const b1 = -2 * cos
  const b2 = 1 - alpha * A
  const a0 = 1 + alpha / A
  const b0n = b0 / a0
  const b1n = b1 / a0
  const b2n = b2 / a0
  const a1n = (-2 * cos) / a0
  const a2n = (1 - alpha / A) / a0

  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i]!
    const y0 = b0n * x0 + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2
    output[i] = y0
    x2 = x1
    x1 = x0
    y2 = y1
    y1 = y0
  }
  return output
}

function normalizeRms(
  samples: Float32Array,
  targetRms: number,
  maxGain: number
): Float32Array {
  const rms = frameRms(samples, 0, samples.length)
  if (rms < 1e-6) return samples
  const gain = Math.min(maxGain, targetRms / rms)
  const output = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    output[i] = Math.max(-1, Math.min(1, (samples[i] ?? 0) * gain))
  }
  return output
}

/** Trim only leading/trailing silence — never remove quiet gaps between words. */
function trimSilenceEdges(
  samples: Float32Array,
  sampleRate: number,
  noiseFloor: number,
  level: 'medium' | 'strong'
): Float32Array {
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.02))
  const threshold = Math.max(noiseFloor * (level === 'medium' ? 5 : 4), 0.012)
  const padFrames = level === 'medium' ? 12 : 8
  const minKeepFrames = 20

  let startFrame = 0
  let endFrame = Math.ceil(samples.length / frameSize) - 1

  while (startFrame < endFrame && frameRms(samples, startFrame * frameSize, frameSize) < threshold) {
    startFrame++
  }
  while (endFrame > startFrame && frameRms(samples, endFrame * frameSize, frameSize) < threshold) {
    endFrame--
  }

  if (endFrame - startFrame < minKeepFrames) return samples

  const start = Math.max(0, (startFrame - padFrames) * frameSize)
  const end = Math.min(samples.length, (endFrame + padFrames + 1) * frameSize)
  if (end - start < frameSize * minKeepFrames) return samples
  return samples.slice(start, end)
}
