import { describe, expect, it } from 'vitest'
import { mergePrefixAndSpoken } from './voice-draft-merge'

describe('mergePrefixAndSpoken', () => {
  it('appends new speech after existing draft', () => {
    expect(mergePrefixAndSpoken('Hello', 'world')).toBe('Hello world')
  })

  it('does not duplicate when transcript already includes the prefix', () => {
    expect(mergePrefixAndSpoken('Hello', 'Hello world')).toBe('Hello world')
  })

  it('keeps draft when transcript is only a suffix overlap', () => {
    expect(mergePrefixAndSpoken('Hello world', 'world')).toBe('Hello world')
  })
})
