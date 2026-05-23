import { flushPersistedStore, type PersistCapableStore } from '@/app/lib/flush-persisted-store'
import { useSettingsStore } from '@/entities/settings/model/store'

/** Write settings store to localStorage immediately (welcome finish, shutdown). */
export async function flushSettingsPersist(): Promise<void> {
  await flushPersistedStore(useSettingsStore as PersistCapableStore)
}
