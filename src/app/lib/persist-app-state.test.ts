import { beforeEach, describe, expect, it, vi } from 'vitest'

const flushPersistedStore = vi.fn(async () => {})
const flushChatPersistDebounce = vi.fn()

vi.mock('@/app/lib/chat-scroll-registry', () => ({
  flushChatScrollPositions: vi.fn()
}))

vi.mock('@/entities/chat/lib/chat-persist-storage', () => ({
  flushChatPersistDebounce
}))

vi.mock('@/entities/chat/model/store', () => ({
  useChatsStore: {}
}))

vi.mock('@/entities/settings/model/store', () => ({
  useSettingsStore: {}
}))

vi.mock('@/app/lib/flush-persisted-store', () => ({
  flushPersistedStore
}))

describe('persistAppState', () => {
  beforeEach(() => {
    flushPersistedStore.mockClear()
    flushChatPersistDebounce.mockClear()
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        cb(0)
        return 0
      }
    )
  })

  it('coalesces concurrent persist into a single flush pass', async () => {
    const { persistAppState, waitForPersistAppState } = await import('./persist-app-state')

    await Promise.all([persistAppState(), persistAppState()])

    expect(flushPersistedStore).toHaveBeenCalledTimes(2)
    await waitForPersistAppState()
  })

  it('flushes chat debounce after writing the chats snapshot', async () => {
    const { persistAppState } = await import('./persist-app-state')

    await persistAppState()

    const chatFlushIndex = flushPersistedStore.mock.invocationCallOrder[0] ?? -1
    const debounceIndex = flushChatPersistDebounce.mock.invocationCallOrder[0] ?? -1
    expect(chatFlushIndex).toBeGreaterThan(-1)
    expect(debounceIndex).toBeGreaterThan(chatFlushIndex)
  })
})
