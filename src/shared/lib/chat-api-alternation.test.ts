import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { normalizeAlternatingChatMessages } from './chat-api-alternation'

function msg(role: Message['role'], content: string): Message {
  return { id: '1', role, content, createdAt: 0 }
}

describe('normalizeAlternatingChatMessages', () => {
  it('merges consecutive user messages', () => {
    const out = normalizeAlternatingChatMessages([
      msg('user', 'Hello'),
      msg('user', 'Follow up')
    ])
    expect(out).toHaveLength(1)
    expect(out[0]?.role).toBe('user')
    expect(out[0]?.content).toContain('Hello')
    expect(out[0]?.content).toContain('Follow up')
  })

  it('merges consecutive assistant messages', () => {
    const out = normalizeAlternatingChatMessages([
      msg('user', 'Hi'),
      msg('assistant', 'Part one'),
      msg('assistant', 'Part two')
    ])
    expect(out.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(out[1]?.content).toContain('Part one')
    expect(out[1]?.content).toContain('Part two')
  })

  it('skips thinking and drops leading assistant', () => {
    const out = normalizeAlternatingChatMessages([
      msg('assistant', 'orphan'),
      msg('thinking', 'reasoning'),
      msg('user', 'Question')
    ])
    expect(out.map((m) => m.role)).toEqual(['user'])
  })
})
