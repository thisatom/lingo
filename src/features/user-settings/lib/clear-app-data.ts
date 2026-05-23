import { flushPersistedStore, type PersistCapableStore } from '@/app/lib/flush-persisted-store'
import { flushSettingsPersist } from '@/app/lib/flush-settings-persist'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { clearAllWebSecrets } from '@/shared/api/web-secrets'
import { getLingo, isElectronApp, isLingoAvailable } from '@/shared/lib/lingo'
import { isWebPlatform } from '@/shared/lib/lingo-bridge'
import { SECRET_PROVIDER_IDS } from '@/shared/types/secret-providers'

/** Reset local state, flush disk, clear secrets — so restart shows in-app onboarding. */
export async function clearAppDataAndPersist(): Promise<void> {
  useChatsStore.getState().resetChats()
  useSettingsStore.getState().resetSettings()

  await flushPersistedStore(useChatsStore as PersistCapableStore)
  await flushSettingsPersist()

  if (isWebPlatform()) {
    clearAllWebSecrets()
    return
  }

  if (isElectronApp() && isLingoAvailable()) {
    await Promise.allSettled(
      SECRET_PROVIDER_IDS.map((provider) => getLingo().secrets.clear(provider))
    )
  }
}
