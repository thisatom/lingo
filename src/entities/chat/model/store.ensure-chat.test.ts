import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PENDING_VOICE_MESSAGE_ID } from '@/entities/chat/lib/pending-composer'
import { PENDING_COMPOSER_CHAT_ID } from '@/entities/chat/lib/pending-composer'
import { useChatsStore } from '@/entities/chat/model/store'

describe('useChatsStore ensureActiveChat', () => {
  beforeEach(() => {
    useChatsStore.getState().resetChats()
  })

  it('reconcileActiveChat does not create a chat when the list is empty', () => {
    expect(useChatsStore.getState().reconcileActiveChat()).toBeNull()
    expect(useChatsStore.getState().chats).toHaveLength(0)
    expect(useChatsStore.getState().activeChatId).toBeNull()
  })

  it('ensureActiveChat creates the first chat on demand', () => {
    const chatId = useChatsStore.getState().ensureActiveChat()
    expect(chatId).toBeTruthy()
    expect(useChatsStore.getState().chats).toHaveLength(1)
    expect(useChatsStore.getState().activeChatId).toBe(chatId)
  })

  it('adoptPendingComposer moves draft and attachments onto the new chat', () => {
    const store = useChatsStore.getState()
    store.setComposerDraft(PENDING_COMPOSER_CHAT_ID, 'First question')
    store.addComposerAttachments(PENDING_COMPOSER_CHAT_ID, [
      {
        id: 'att-1',
        kind: 'image',
        name: 'photo.png',
        mimeType: 'image/png',
        sizeBytes: 1,
        dataUrl: 'data:image/png;base64,AA=='
      }
    ])

    const chatId = store.ensureActiveChat()
    store.adoptPendingComposer(chatId)

    expect(store.getComposerDraft(chatId)).toBe('First question')
    expect(store.getComposerDraft(PENDING_COMPOSER_CHAT_ID)).toBe('')
    expect(store.getComposerAttachments(chatId)).toHaveLength(1)
    expect(store.getComposerAttachments(PENDING_COMPOSER_CHAT_ID)).toHaveLength(0)
  })

  it('ensureActiveChat does not copy pending composer draft onto the new chat', () => {
    const store = useChatsStore.getState()
    store.setComposerDraft(PENDING_COMPOSER_CHAT_ID, 'привет')

    const chatId = store.ensureActiveChat()

    expect(store.getComposerDraft(chatId)).toBe('')
    expect(store.getComposerDraft(PENDING_COMPOSER_CHAT_ID)).toBe('привет')
  })

  it('clearComposerDraft clears active chat and pending slots', () => {
    const store = useChatsStore.getState()
    store.setComposerDraft(PENDING_COMPOSER_CHAT_ID, 'привет')
    const chatId = store.ensureActiveChat()
    store.setComposerDraft(chatId, 'привет')

    store.clearComposerDraft(chatId)

    expect(store.getComposerDraft(chatId)).toBe('')
    expect(store.getComposerDraft(PENDING_COMPOSER_CHAT_ID)).toBe('')
  })

  it('createChat adopts pending composer draft onto the new chat', () => {
    useChatsStore.getState().setComposerDraft(PENDING_COMPOSER_CHAT_ID, 'Draft before new chat')

    const chatId = useChatsStore.getState().createChat()
    const after = useChatsStore.getState()

    expect(after.getComposerDraft(chatId)).toBe('Draft before new chat')
    expect(after.getComposerDraft(PENDING_COMPOSER_CHAT_ID)).toBe('')
    expect(after.chats).toHaveLength(1)
  })

  it('beginVoiceUserMessageAction does not create a chat before commit', async () => {
    const { beginVoiceUserMessageAction } = await import(
      '@/features/ai-chat/model/chat-agent-user-actions'
    )
    const deps = {
      addMessage: vi.fn(() => 'msg-1'),
      removeMessagesFrom: vi.fn(),
      removeMessagesAfter: vi.fn(),
      updateUserMessageContent: vi.fn(),
      updateMessageContent: vi.fn(),
      stopAgent: vi.fn(),
      runAssistantReply: vi.fn(async () => true),
      enqueueUserMessage: vi.fn(),
      setBlurAnimateMessageId: vi.fn(),
      setError: vi.fn()
    }

    const result = beginVoiceUserMessageAction(deps)

    expect(useChatsStore.getState().chats).toHaveLength(0)
    expect(deps.addMessage).not.toHaveBeenCalled()
    expect(result.messageId).toBe(PENDING_VOICE_MESSAGE_ID)
    expect(result.chatId).toBe(PENDING_COMPOSER_CHAT_ID)
  })
})
