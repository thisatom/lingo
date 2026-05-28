import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { resolveWebSearchForChatTurn } from './web-search-turn'

function user(id: string, content: string, attachments?: Message['attachments']): Message {
  return { id, role: 'user', content, createdAt: 0, attachments }
}

describe('resolveWebSearchForChatTurn', () => {
  const settings = { webSearchEnabled: true, llmBackend: 'openrouter' as const }

  it('uses the last user message after an edit (not an older question)', () => {
    const messages = [
      user('u1', 'hi'),
      user('u2', 'What is quantum computing in simple terms?')
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(true)
  })

  it('skips when the thread has user attachments', () => {
    const messages = [
      user('u1', 'explain this image', [{ id: 'a', kind: 'image', mimeType: 'image/png', sizeBytes: 1 }])
    ]
    expect(resolveWebSearchForChatTurn(settings, messages)).toBe(false)
  })

  it('allows local web search with custom endpoint', () => {
    const messages = [user('u1', 'What is the weather in Paris today?')]
    expect(
      resolveWebSearchForChatTurn({ webSearchEnabled: true, llmBackend: 'custom' }, messages)
    ).toBe(true)
  })

  it('runs when web search toggle is on even for short time questions', () => {
    const messages = [user('u1', 'который час')]
    expect(resolveWebSearchForChatTurn({ webSearchEnabled: true, llmBackend: 'custom' }, messages)).toBe(
      true
    )
  })

  it('does not run when web search toggle is off', () => {
    const messages = [user('u1', 'сколько времени')]
    expect(
      resolveWebSearchForChatTurn({ webSearchEnabled: false, llmBackend: 'custom' }, messages)
    ).toBe(false)
  })
})
