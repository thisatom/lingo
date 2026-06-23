import { describe, expect, it } from 'vitest'
import type { ChatMessagePayload } from '@/shared/types/ipc'
import { lastUserMessageHasImages } from './vision-models'

describe('lastUserMessageHasImages', () => {
  it('returns false when only an earlier user turn had images', () => {
    const messages: ChatMessagePayload[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'image turn' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }
        ]
      },
      { role: 'assistant', content: 'seen' },
      { role: 'user', content: 'What is the weather in Paris today?' }
    ]

    expect(lastUserMessageHasImages(messages)).toBe(false)
  })

  it('returns true when the latest user turn includes an image', () => {
    const messages: ChatMessagePayload[] = [
      { role: 'user', content: 'text only' },
      {
        role: 'user',
        content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }]
      }
    ]

    expect(lastUserMessageHasImages(messages)).toBe(true)
  })
})
