import { describe, expect, it } from 'vitest'
import {
  restoreUserMessageEdit,
  snapshotUserMessageEdit
} from './submit-edited-user-message'
import type { Message } from '@/entities/message/model/types'

function msg(id: string, role: 'user' | 'assistant', content: string): Message {
  return { id, role, content, createdAt: 0 }
}

describe('submit-edited-user-message snapshot', () => {
  it('restores user text and trailing assistant messages after failed edit', () => {
    const messages = [
      msg('u1', 'user', 'old question'),
      msg('a1', 'assistant', 'answer'),
      msg('a2', 'assistant', 'second')
    ]
    const snapshot = snapshotUserMessageEdit(messages, 'u1')
    expect(snapshot).not.toBeNull()

    const edited = [
      msg('u1', 'user', 'new question'),
      msg('a9', 'assistant', 'partial')
    ]
    const restored = restoreUserMessageEdit(edited, snapshot!)
    expect(restored).toHaveLength(3)
    expect(restored[0].content).toBe('old question')
    expect(restored[1].id).toBe('a1')
    expect(restored[2].id).toBe('a2')
  })
})
