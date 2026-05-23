import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { formatThoughtDuration, getThinkingDurationMs } from './thought-duration'

function msg(
  id: string,
  role: Message['role'],
  createdAt: number,
  content = 'x'
): Message {
  return { id, role, content, createdAt }
}

describe('thought-duration', () => {
  it('formatThoughtDuration uses seconds under one minute', () => {
    expect(formatThoughtDuration(3000)).toBe('Thought for 3 seconds')
    expect(formatThoughtDuration(1000)).toBe('Thought for 1 second')
  })

  it('formatThoughtDuration uses minutes at 60s and above', () => {
    expect(formatThoughtDuration(60_000)).toBe('Thought for 1 minute')
    expect(formatThoughtDuration(150_000)).toBe('Thought for 3 minutes')
  })

  it('getThinkingDurationMs spans until the following assistant message', () => {
    const messages = [
      msg('t1', 'thinking', 1000),
      msg('a1', 'assistant', 4500)
    ]
    expect(getThinkingDurationMs(messages[0], messages)).toBe(3500)
  })

  it('uses streamEndedAt when assistant timestamp matches thinking', () => {
    const messages = [msg('t1', 'thinking', 1000, 'reasoning text')]
    expect(getThinkingDurationMs(messages[0], messages, 5500)).toBe(4500)
  })
})
