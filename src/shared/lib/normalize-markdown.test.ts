import { describe, expect, it } from 'vitest'
import { normalizeMarkdown } from './normalize-markdown'

describe('normalizeMarkdown', () => {
  it('converts keycap digits to plain numbered list markers', () => {
    const raw = '1️⃣ First step\n2️⃣ Second step'
    expect(normalizeMarkdown(raw)).toBe('1. First step\n2. Second step')
  })
})
