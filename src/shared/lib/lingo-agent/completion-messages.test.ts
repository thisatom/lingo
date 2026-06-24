import { describe, expect, it } from 'vitest'
import { completionMessagesToModelMessages } from '@/shared/lib/lingo-agent/completion-messages'

describe('completionMessagesToModelMessages', () => {
  it('maps string messages and drops thinking role', () => {
    expect(
      completionMessagesToModelMessages([
        { role: 'system', content: 'You are Lingo' },
        { role: 'user', content: 'Hello' },
        { role: 'thinking', content: 'plan…' },
        { role: 'assistant', content: 'Hi!' }
      ])
    ).toEqual([
      { role: 'system', content: 'You are Lingo' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' }
    ])
  })

  it('maps image parts for vision requests', () => {
    expect(
      completionMessagesToModelMessages([
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } }
          ]
        }
      ])
    ).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is this?' },
          { type: 'image', image: 'data:image/png;base64,abc' }
        ]
      }
    ])
  })
})
