import { describe, expect, it } from 'vitest'
import { resolveAgentTurnPolicy } from '@/shared/lib/lingo-agent/turn-policy'

describe('resolveAgentTurnPolicy', () => {
  it('uses general mode when language practice is off', () => {
    const policy = resolveAgentTurnPolicy({
      languagePracticeEnabled: false,
      webSearchEnabled: false,
      messages: [{ id: '1', role: 'user', content: 'Explain recursion', createdAt: 0 }],
      lastUserMessage: 'Explain recursion'
    })

    expect(policy.promptMode).toBe('general')
    expect(policy.languagePractice).toBe(false)
    expect(policy.shouldSearch).toBe(false)
  })

  it('uses research mode for factual questions with web search on', () => {
    const policy = resolveAgentTurnPolicy({
      languagePracticeEnabled: false,
      webSearchEnabled: true,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'What is the weather in Paris today?',
          createdAt: 0
        }
      ],
      lastUserMessage: 'What is the weather in Paris today?'
    })

    expect(policy.promptMode).toBe('research')
    expect(policy.shouldSearch).toBe(true)
  })

  it('forces search even when toggle is off for explicit web search phrases', () => {
    const policy = resolveAgentTurnPolicy({
      languagePracticeEnabled: true,
      webSearchEnabled: false,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'search the web for latest Mars news',
          createdAt: 0
        }
      ],
      lastUserMessage: 'search the web for latest Mars news'
    })

    expect(policy.forceWebSearch).toBe(true)
    expect(policy.searchQuery).toBe('latest Mars news')
    expect(policy.shouldSearch).toBe(true)
  })
})
