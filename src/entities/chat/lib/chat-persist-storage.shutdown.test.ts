import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_PERSIST_KEY,
  chatPersistStorage,
  flushChatPersistDebounce,
  writeChatPersistSnapshotNow
} from './chat-persist-storage'

function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    }
  }
}

describe('chatPersistStorage shutdown writes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  it('writeChatPersistSnapshotNow bypasses debounce', () => {
    const payload = JSON.stringify({ state: { chats: [] }, version: 5 })
    writeChatPersistSnapshotNow(CHAT_PERSIST_KEY, payload)

    expect(localStorage.getItem(CHAT_PERSIST_KEY)).toBe(payload)
  })

  it('debounced setItem is flushed on shutdown helper', () => {
    const payload = JSON.stringify({ state: { chats: [{ id: '1' }] }, version: 5 })
    chatPersistStorage.setItem(CHAT_PERSIST_KEY, payload)
    expect(localStorage.getItem(CHAT_PERSIST_KEY)).toBeNull()

    flushChatPersistDebounce()
    expect(localStorage.getItem(CHAT_PERSIST_KEY)).toBe(payload)
  })
})
