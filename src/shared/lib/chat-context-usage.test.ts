import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import {
  estimateChatContextTokens,
  getChatContextUsageDetails,
  resolveOutputTokenReserve,
  trimMessagesToTokenBudget
} from './chat-context-usage'
import { LLM_MAX_TOKENS_UNLIMITED } from './llm-max-tokens'

function msg(role: Message['role'], content: string, id: string): Message {
  return { id, role, content, createdAt: 0 }
}

describe('getChatContextUsageDetails', () => {
  it('excludes thinking messages from token estimate', () => {
    const withThinking = [
      msg('user', 'hi', '1'),
      msg('thinking', 'y'.repeat(20_000), '2'),
      msg('assistant', 'ok', '3')
    ]
    const withoutThinking = [
      msg('user', 'hi', '1'),
      msg('assistant', 'ok', '3')
    ]
    const a = getChatContextUsageDetails(withThinking, 'openai/gpt-4o-mini', 1024)
    const b = getChatContextUsageDetails(withoutThinking, 'openai/gpt-4o-mini', 1024)
    expect(a.messageTokens).toBe(b.messageTokens)
    expect(a.messageCount).toBe(2)
  })

  it('marks unlimited reply budget in settings', () => {
    const usage = getChatContextUsageDetails(
      [msg('user', 'hi', '1')],
      'openai/gpt-4o-mini',
      LLM_MAX_TOKENS_UNLIMITED
    )
    expect(usage.replyBudgetUnlimited).toBe(true)
    expect(usage.outputReserveTokens).toBeGreaterThan(2048)
  })
})

describe('resolveOutputTokenReserve', () => {
  it('uses a large reserve from model context when unlimited', () => {
    expect(resolveOutputTokenReserve('openai/gpt-4o-mini', LLM_MAX_TOKENS_UNLIMITED)).toBe(32_768)
    expect(resolveOutputTokenReserve('test/tiny-context', LLM_MAX_TOKENS_UNLIMITED)).toBe(2_000)
  })
})

describe('estimateChatContextTokens', () => {
  it('excludes thinking messages like the usage meter', () => {
    const withThinking = [
      msg('user', 'hi', '1'),
      msg('thinking', 'y'.repeat(20_000), '2'),
      msg('assistant', 'ok', '3')
    ]
    const withoutThinking = [msg('user', 'hi', '1'), msg('assistant', 'ok', '3')]
    expect(estimateChatContextTokens(withThinking)).toBe(
      estimateChatContextTokens(withoutThinking)
    )
  })
})

describe('trimMessagesToTokenBudget', () => {
  it('drops oldest messages when over budget', () => {
    const long = 'x'.repeat(50_000)
    const messages = [
      msg('user', long, '1'),
      msg('assistant', long, '2'),
      msg('user', 'latest question', '3')
    ]
    const trimmed = trimMessagesToTokenBudget(messages, 'test/tiny-context', 1024)
    expect(trimmed.length).toBeLessThan(messages.length)
    expect(trimmed[trimmed.length - 1]?.content).toBe('latest question')
  })

  it('keeps short threads intact', () => {
    const messages = [msg('user', 'hi', '1'), msg('assistant', 'hello', '2')]
    expect(trimMessagesToTokenBudget(messages, 'openai/gpt-4o-mini', 1024)).toEqual(messages)
  })
})
