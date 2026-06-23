import { describe, expect, it } from 'vitest'
import { splitTextForTranslation } from './split-translation-text'

describe('splitTextForTranslation', () => {
  it('returns one chunk for short text', () => {
    expect(splitTextForTranslation('Hello world')).toEqual(['Hello world'])
  })

  it('splits long text on paragraph boundaries', () => {
    const paragraph = 'word '.repeat(800).trim()
    const text = `${paragraph}\n\n${paragraph}`
    const chunks = splitTextForTranslation(text, 1000)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.join('\n\n')).toContain('word')
  })
})
