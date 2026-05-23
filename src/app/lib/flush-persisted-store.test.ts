import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_PERSIST_KEY } from '@/entities/chat/lib/chat-persist-storage'
import { flushPersistedStore, type PersistCapableStore } from './flush-persisted-store'

function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    }
  }
}

describe('flushPersistedStore', () => {
  it('writes partialized state with version to persist storage', async () => {
    const writes: Array<{ name: string; value: unknown }> = []

    const store = {
      getState: () => ({ secret: 'runtime', scroll: 99 }),
      persist: {
        getOptions: () => ({
          name: 'test-store',
          version: 3,
          partialize: (state: { secret: string; scroll: number }) => ({
            scroll: state.scroll
          }),
          storage: {
            getItem: async () => null,
            setItem: async (name: string, value: unknown) => {
              writes.push({ name, value })
            },
            removeItem: async () => {}
          }
        })
      }
    } as unknown as PersistCapableStore

    await flushPersistedStore(store)

    expect(writes).toEqual([
      {
        name: 'test-store',
        value: { state: { scroll: 99 }, version: 3 }
      }
    ])
  })

  it('writes chat snapshot to localStorage immediately', async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock())

    const store = {
      getState: () => ({ chats: [{ id: 'a' }], chatScrollByChatId: { a: 120 } }),
      persist: {
        getOptions: () => ({
          name: CHAT_PERSIST_KEY,
          version: 5,
          partialize: (state: { chats: unknown[]; chatScrollByChatId: Record<string, number> }) => ({
            chats: state.chats,
            chatScrollByChatId: state.chatScrollByChatId
          }),
          storage: {
            getItem: async () => null,
            setItem: async () => {},
            removeItem: async () => {}
          }
        })
      }
    } as unknown as PersistCapableStore

    await flushPersistedStore(store)

    const raw = localStorage.getItem(CHAT_PERSIST_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as {
      state: { chatScrollByChatId: Record<string, number> }
    }
    expect(parsed.state.chatScrollByChatId.a).toBe(120)
  })
})
