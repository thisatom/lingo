import { beforeEach, describe, expect, it } from 'vitest'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import {
  getAgentSessionSnapshot,
  getAgentSessionSnapshotForView,
  isAgentSessionBusy
} from '@/features/ai-chat/lib/agent-session-snapshot'
import { setAgentStreamSession } from '@/features/ai-chat/lib/agent-stream-session'
import { setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'

describe('agent-session-snapshot', () => {
  const chatA = 'chat-a'
  const chatB = 'chat-b'

  beforeEach(() => {
    setAgentStreamSession(null, false)
    useChatsStore.setState({
      chats: [
        { id: chatA, title: 'A', messages: [], updatedAt: 0, createdAt: 0 },
        { id: chatB, title: 'B', messages: [], updatedAt: 0, createdAt: 0 }
      ],
      activeChatId: chatB
    })
    useConversationStore.setState({ stage: 'idle', error: null })
  })

  it('is busy when pipeline thinking or stream active', () => {
    setPipelineStageForChat(chatA, 'thinking')
    expect(isAgentSessionBusy(getAgentSessionSnapshot(chatA))).toBe(true)

    setPipelineStageForChat(chatA, 'idle')
    setAgentStreamSession(chatA, true)
    expect(isAgentSessionBusy(getAgentSessionSnapshot(chatA))).toBe(true)
  })

  it('view snapshot is idle for active chat while another chat streams', () => {
    setAgentStreamSession(chatA, true)
    setPipelineStageForChat(chatA, 'thinking')

    const snapshot = getAgentSessionSnapshotForView(chatB, 'idle')
    expect(snapshot.chatId).toBe(chatB)
    expect(isAgentSessionBusy(snapshot)).toBe(false)
  })
})
