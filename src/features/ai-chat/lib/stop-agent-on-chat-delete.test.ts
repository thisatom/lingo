import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { stopAgentOnChatDeleted } from '@/features/ai-chat/lib/stop-agent-on-chat-delete'
import { getSharedAgentChatSessionRefs } from '@/features/ai-chat/model/agent-chat-session'

const executeAgentStopMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/ai-chat/lib/chat-agent-stop', () => ({
  executeAgentStop: (...args: unknown[]) => executeAgentStopMock(...args)
}))

describe('stopAgentOnChatDeleted', () => {
  beforeEach(() => {
    executeAgentStopMock.mockClear()
    setAgentStreamSession(null, false)
    getSharedAgentChatSessionRefs().streamTargetChatIdRef.current = null
    useChatsStore.setState({ chats: [], activeChatId: null })
  })

  it('force-stops when the deleted chat owns the stream session', () => {
    const chatId = 'deleted-chat'
    setAgentStreamSession(chatId, true)
    getSharedAgentChatSessionRefs().streamTargetChatIdRef.current = chatId

    stopAgentOnChatDeleted(chatId)

    expect(executeAgentStopMock).toHaveBeenCalledWith(
      { chatId, force: true },
      expect.any(Object)
    )
  })

  it('does nothing when another chat is streaming', () => {
    setAgentStreamSession('other-chat', true)

    stopAgentOnChatDeleted('deleted-chat')

    expect(executeAgentStopMock).not.toHaveBeenCalled()
  })

  it('force-stops when the deleted chat pipeline was still busy', () => {
    const chatId = 'busy-deleted'

    stopAgentOnChatDeleted(chatId, { pipelineBusy: true })

    expect(executeAgentStopMock).toHaveBeenCalledWith(
      { chatId, force: true },
      expect.any(Object)
    )
  })
})
