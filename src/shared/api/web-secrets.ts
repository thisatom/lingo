/**
 * Browser-only secret storage for `npm run dev:web` / `build:web`.
 * Keys are persisted in localStorage as plain text — dev preview only, not production-safe.
 * Desktop Electron uses keytar in main (`electron/main/secrets.ts`).
 */
import type { SecretProviderId, SecretStatus } from '@/shared/types/ipc'
import { SECRET_PROVIDER_IDS } from '@/shared/types/secret-providers'
import { openRouterConfig } from '@/shared/config/openrouter'
import { openRouterHeaders } from '@/shared/lib/openrouter-headers'
import { formatOpenRouterError } from '@/shared/lib/openrouter-errors'

const STORAGE_PREFIX = 'lingo.secret.'

function storageKey(provider: SecretProviderId): string {
  return `${STORAGE_PREFIX}${provider}`
}

function maskKey(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export async function getWebSecretStatus(provider: SecretProviderId): Promise<SecretStatus> {
  const value = localStorage.getItem(storageKey(provider))
  return {
    provider,
    isSet: Boolean(value),
    masked: value ? maskKey(value) : undefined
  }
}

export async function setWebSecret(
  provider: SecretProviderId,
  value: string
): Promise<SecretStatus> {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('EMPTY_KEY')
  localStorage.setItem(storageKey(provider), trimmed)
  return getWebSecretStatus(provider)
}

export async function clearWebSecret(provider: SecretProviderId): Promise<SecretStatus> {
  localStorage.removeItem(storageKey(provider))
  return getWebSecretStatus(provider)
}

export async function getWebSecret(provider: SecretProviderId): Promise<string | null> {
  return localStorage.getItem(storageKey(provider))
}

export async function validateWebOpenRouterKey(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = await getWebSecret('openrouter')
  if (!apiKey) return { ok: false, error: 'NO_OPENROUTER_KEY' }

  try {
    const response = await fetch(`${openRouterConfig.baseURL}/models`, {
      headers: openRouterHeaders(apiKey)
    })
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      let message = `OpenRouter request failed (${response.status})`
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } }
        if (parsed.error?.message) message = parsed.error.message
      } catch {
        // ignore
      }
      return { ok: false, error: formatOpenRouterError(message) }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}

export function clearAllWebSecrets(): void {
  for (const provider of SECRET_PROVIDER_IDS) {
    localStorage.removeItem(storageKey(provider))
  }
}
