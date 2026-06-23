import { describe, expect, it } from 'vitest'
import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'
import { decodeWavPcm16ToFloat32, encodeWav16Mono, resampleMono } from './wav-pcm'

describe('resampleMono', () => {
  it('halves sample count when downsampling 2:1', () => {
    const input = new Float32Array([1, 0, -1, 0])
    const output = resampleMono(input, 32_000, 16_000)
    expect(output.length).toBe(2)
    expect(output[0]).toBeCloseTo(0.5, 5)
    expect(output[1]).toBeCloseTo(-0.5, 5)
  })
})

describe('decodeWavPcm16ToFloat32', () => {
  it('resamples non-16kHz WAV instead of throwing', () => {
    const at32k = new Float32Array(3200)
    for (let i = 0; i < at32k.length; i++) {
      at32k[i] = Math.sin((i / 32_000) * Math.PI * 440)
    }
    const wav32 = encodeWav16Mono(at32k, 32_000)
    const decoded = decodeWavPcm16ToFloat32(wav32, WHISPER_SAMPLE_RATE)
    expect(decoded.length).toBe(1600)
  })

  it('throws UNSUPPORTED_SAMPLE_RATE when resample is disabled', () => {
    const wav32 = encodeWav16Mono(new Float32Array(3200), 32_000)
    expect(() =>
      decodeWavPcm16ToFloat32(wav32, WHISPER_SAMPLE_RATE, { resample: false })
    ).toThrow('UNSUPPORTED_SAMPLE_RATE')
  })
})
