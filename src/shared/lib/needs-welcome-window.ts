/** Keep in sync with `useSettingsStore` persist `version`. */
export const SETTINGS_PERSIST_VERSION = 20

/** Onboarding flag introduced at settings persist v13 (see store migrate). */
export const SETTINGS_ONBOARDING_MIN_VERSION = 13

export const SETTINGS_STORAGE_KEY = 'lingo-settings'
export const CHATS_STORAGE_KEY = 'lingo-chats-v3'

export type StoredSettingsBlob = {
  version?: number
  state?: { onboardingCompleted?: boolean }
}

export type StoredChatsBlob = {
  state?: { chats?: unknown[] }
}

/**
 * Mirror critical `lingo-settings` migrate rules for checks against raw localStorage
 * (before Zustand migrate runs in the renderer).
 */
export function normalizeStoredSettingsForWelcome(
  settings: StoredSettingsBlob | null
): StoredSettingsBlob | null {
  if (!settings) return null

  const version = settings.version ?? 0
  if (version < SETTINGS_ONBOARDING_MIN_VERSION) {
    return {
      ...settings,
      version: SETTINGS_ONBOARDING_MIN_VERSION,
      state: { ...settings.state, onboardingCompleted: true }
    }
  }

  return settings
}

/** In-app onboarding when onboarding is incomplete and there are no chats. */
export function needsInAppOnboarding(
  settings: StoredSettingsBlob | null,
  chats: StoredChatsBlob | null = null
): boolean {
  const chatList = chats?.state?.chats
  if (Array.isArray(chatList) && chatList.length > 0) return false

  const normalized = normalizeStoredSettingsForWelcome(settings)
  if (!normalized) return true

  return normalized.state?.onboardingCompleted !== true
}
