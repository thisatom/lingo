import { describe, expect, it } from 'vitest'
import { takeSpeechChunks } from './split-speech-sentences'

describe('takeSpeechChunks', () => {
  it('starts speaking early on the first comma clause when eager', () => {
    const pending = 'Похоже, вы просто делитесь своими мыслями, и если нужна помощь'
    const { chunks, remainder } = takeSpeechChunks(pending, false, true)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0]).toMatch(/^Похоже/)
    expect(remainder.length).toBeGreaterThan(0)
  })

  it('flushes the tail on finish', () => {
    const pending = 'Если вам нужна помощь — дайте знать'
    const { chunks } = takeSpeechChunks(pending, true, false)
    expect(chunks.join(' ')).toContain('дайте знать')
  })

  it('keeps incomplete sentences in remainder until flush', () => {
    const pending = 'Первая фраза. Вторая без точки'
    const { chunks, remainder } = takeSpeechChunks(pending, false, false)
    expect(chunks).toEqual(['Первая фраза.'])
    expect(remainder).toBe('Вторая без точки')
  })
})
