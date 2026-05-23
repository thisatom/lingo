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

export type PersistedWelcomeData = {
  settings: StoredSettingsBlob | null
  chats: StoredChatsBlob | null
}

export type PersistedWelcomeReadResult =
  | { ok: true; data: PersistedWelcomeData }
  | { ok: false; reason: string }

/**
 * Mirror critical `lingo-settings` migrate rules so main-process welcome check
 * matches post-hydrate renderer state (raw localStorage is read before Zustand migrate).
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

/**
 * Dedicated welcome window (`welcome.html`) — only before any settings were ever saved.
 * After “Clear app data” or incomplete onboarding, use in-app `OnboardingGate` instead.
 */
export function needsWelcomeWindow(
  settings: StoredSettingsBlob | null,
  chats: StoredChatsBlob | null = null
): boolean {
  const chatList = chats?.state?.chats
  if (Array.isArray(chatList) && chatList.length > 0) return false
  if (settings !== null) return false
  return true
}

/** In-app onboarding dialog when onboarding is incomplete and there are no chats. */
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

export function evaluateWelcomeNeeded(
  read: PersistedWelcomeReadResult
): boolean {
  if (!read.ok) return false
  return needsWelcomeWindow(read.data.settings, read.data.chats)
}

export function parseWelcomePersistPayload(raw: unknown): PersistedWelcomeReadResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'invalid_payload' }
  }

  const record = raw as Record<string, unknown>
  if (typeof record.error === 'string') {
    return { ok: false, reason: record.error }
  }

  const settings =
    record.settings === null || record.settings === undefined
      ? null
      : typeof record.settings === 'object'
        ? (record.settings as StoredSettingsBlob)
        : null

  if (record.settings != null && settings === null) {
    return { ok: false, reason: 'settings_shape' }
  }

  const chats =
    record.chats === null || record.chats === undefined
      ? null
      : typeof record.chats === 'object'
        ? (record.chats as StoredChatsBlob)
        : null

  if (record.chats != null && chats === null) {
    return { ok: false, reason: 'chats_shape' }
  }

  return { ok: true, data: { settings, chats } }
}
