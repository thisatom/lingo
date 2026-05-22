import { describe, expect, it } from 'vitest'
import { flushPersistedStore, type PersistCapableStore } from './flush-persisted-store'

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
})
