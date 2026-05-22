import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_PERSIST_KEY, chatPersistStorage } from './chat-persist-storage'

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

describe('chatPersistStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  it('returns null and clears corrupt JSON', () => {
    localStorage.setItem(CHAT_PERSIST_KEY, '{not-json')

    expect(chatPersistStorage.getItem(CHAT_PERSIST_KEY)).toBeNull()
    expect(localStorage.getItem(CHAT_PERSIST_KEY)).toBeNull()
  })

  it('returns trimmed valid JSON', () => {
    const payload = JSON.stringify({ state: { chats: [] }, version: 5 })
    localStorage.setItem(CHAT_PERSIST_KEY, payload)

    expect(chatPersistStorage.getItem(CHAT_PERSIST_KEY)).toBe(payload)
  })
})
