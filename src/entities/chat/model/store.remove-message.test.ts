import { beforeEach, describe, expect, it } from 'vitest'
import type { Message } from '@/entities/message/model/types'
import { useChatsStore } from './store'

function message(id: string, role: Message['role'], content: string): Message {
  return { id, role, content, createdAt: 0 }
}

describe('removeMessage', () => {
  beforeEach(() => {
    useChatsStore.setState({
      chats: [
        {
          id: 'c1',
          title: 'Test',
          messages: [
            message('u1', 'user', 'hi'),
            message('t1', 'thinking', ''),
            message('a1', 'assistant', 'answer')
          ],
          updatedAt: 0,
          createdAt: 0
        }
      ],
      activeChatId: 'c1'
    })
  })

  it('removes only the target message', () => {
    useChatsStore.getState().removeMessage('t1', 'c1')
    const roles = useChatsStore.getState().chats[0]?.messages.map((m) => m.role)
    expect(roles).toEqual(['user', 'assistant'])
  })
})
