import { describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { estimateTurnHeightPx } from './estimate-turn-height'

function msg(role: Message['role'], content: string): Message {
  return { id: role, role, content, createdAt: 0 }
}

describe('estimateTurnHeightPx', () => {
  it('accounts for thinking and assistant content', () => {
    const short = estimateTurnHeightPx({
      id: 'u1',
      user: msg('user', 'hi'),
      assistantMessages: [msg('thinking', ''), msg('assistant', 'ok')]
    })
    const long = estimateTurnHeightPx({
      id: 'u2',
      user: msg('user', 'question'),
      assistantMessages: [
        msg('thinking', 'x'.repeat(800)),
        msg('assistant', 'y'.repeat(2000))
      ]
    })
    expect(long).toBeGreaterThan(short)
  })
})
