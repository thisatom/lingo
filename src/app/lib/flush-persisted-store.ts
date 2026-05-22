import type { PersistStorage } from 'zustand/middleware'
import type { StoreApi, UseBoundStore } from 'zustand'

export type PersistCapableStore = UseBoundStore<StoreApi<unknown>> & {
  persist: {
    getOptions: () => {
      name?: string
      storage?: PersistStorage<unknown>
      version?: number
      partialize?: (state: unknown) => unknown
    }
  }
}

/** Write through the same storage shape as zustand/middleware `persist`. */
export async function flushPersistedStore(store: PersistCapableStore): Promise<void> {
  const { name, storage, version, partialize } = store.persist.getOptions()
  if (!name || !storage?.setItem) return

  const state = store.getState()
  const partialized = partialize ? partialize(state) : state

  await Promise.resolve(
    storage.setItem(name, {
      state: partialized,
      version: version ?? 0
    })
  )
}
