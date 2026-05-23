import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { trimMessagesToTokenBudget } from './chat-context-usage'

function msg(role: 'user' | 'assistant', content: string, id: string): Message {
  return { id, role, content, createdAt: 0 }
}

describe('trimMessagesToTokenBudget', () => {
  it('drops oldest messages when over budget', () => {
    const long = 'x'.repeat(50_000)
    const messages = [
      msg('user', long, '1'),
      msg('assistant', long, '2'),
      msg('user', 'latest question', '3')
    ]
    const trimmed = trimMessagesToTokenBudget(messages, 'unknown/small-model', 1024, 0.85)
    expect(trimmed.length).toBeLessThan(messages.length)
    expect(trimmed[trimmed.length - 1]?.content).toBe('latest question')
  })

  it('keeps short threads intact', () => {
    const messages = [msg('user', 'hi', '1'), msg('assistant', 'hello', '2')]
    expect(trimMessagesToTokenBudget(messages, 'openai/gpt-4o-mini', 1024)).toEqual(messages)
  })
})
