import { describe, expect, it } from 'vitest'
import { resolveWhisperAudioCtx } from './whisper-audio-ctx'

describe('resolveWhisperAudioCtx', () => {
  it('uses smaller context only for very short clips', () => {
    expect(resolveWhisperAudioCtx(16_000 * 1)).toBe(512)
    expect(resolveWhisperAudioCtx(16_000 * 4)).toBe(1500)
    expect(resolveWhisperAudioCtx(16_000 * 8)).toBe(1500)
    expect(resolveWhisperAudioCtx(16_000 * 30)).toBe(1500)
  })
})
