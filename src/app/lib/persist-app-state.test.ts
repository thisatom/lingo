import { beforeEach, describe, expect, it, vi } from 'vitest'

const flushPersistedStore = vi.fn(async () => {})

vi.mock('@/app/lib/chat-scroll-registry', () => ({
  flushChatScrollPositions: vi.fn()
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
})
