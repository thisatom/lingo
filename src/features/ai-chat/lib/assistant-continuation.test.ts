import { describe, expect, it } from 'vitest'
import { canContinueAssistantReply } from '@/features/ai-chat/lib/assistant-continuation'
import type { Message } from '@/entities/message/model/types'

function assistant(content: string, replyStatus?: Message['replyStatus']): Message {
  return {
    id: 'a1',
    role: 'assistant',
    content,
    createdAt: 1,
    replyStatus
  }
}

describe('canContinueAssistantReply', () => {
  it('allows continue for interrupted replies with text', () => {
    expect(canContinueAssistantReply(assistant('Partial answer', 'interrupted'))).toBe(true)
  })

  it('allows continue for incomplete replies', () => {
    expect(canContinueAssistantReply(assistant('Partial answer', 'incomplete'))).toBe(true)
  })

  it('rejects empty assistant messages', () => {
    expect(canContinueAssistantReply(assistant('   '))).toBe(false)
  })
})
