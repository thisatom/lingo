import { describe, expect, it } from 'vitest'
import { base64ToFloat32, float32ToBase64 } from './pcm-base64'

describe('pcm-base64', () => {
  it('round-trips float32 PCM', () => {
    const samples = new Float32Array([0, 0.25, -0.5, 1])
    const encoded = float32ToBase64(samples)
    const decoded = base64ToFloat32(encoded)
    expect(Array.from(decoded)).toEqual(Array.from(samples))
  })
})
