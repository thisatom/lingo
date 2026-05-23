import { flushSettingsPersist } from '@/app/lib/flush-settings-persist'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import type { AppTheme } from '@/shared/types/app-theme'

export type OnboardingFormValues = {
  displayName: string
  appTheme: AppTheme
  practiceLanguage: string
  modelId: string
  addressUserByName: boolean
  apiKey?: string
}

export async function completeOnboarding(
  values: OnboardingFormValues,
  options: { skipApiKey?: boolean } = {}
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = values.displayName.trim()
  if (!name) {
    return { ok: false, error: 'Enter your name to continue.' }
  }

  const store = useSettingsStore.getState()
  store.setDisplayName(name)
  store.setAppTheme(values.appTheme)
  store.setPracticeLanguage(values.practiceLanguage)
  store.setModelId(values.modelId)
  store.setAddressUserByName(values.addressUserByName)

  const apiKey = values.apiKey?.trim() ?? ''
  if (!options.skipApiKey && apiKey.length > 0) {
    if (!isLingoAvailable()) {
      return { ok: false, error: 'Desktop API unavailable. Run the app with npm run dev.' }
    }
    await getLingo().secrets.set('openrouter', apiKey)
    const result = await getLingo().secrets.validateOpenRouter()
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'OpenRouter key validation failed.' }
    }
  }

  store.setOnboardingCompleted(true)
  await flushSettingsPersist()
  return { ok: true }
}
