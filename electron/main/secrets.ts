import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import keytar from 'keytar'
import {
  isMaskedSecretDisplay,
  maskSecretForDisplay,
  normalizeBearerApiKey
} from '../../src/shared/lib/secret-mask'
import type { SecretProviderId, SecretStatus } from '../../src/shared/types/ipc'

const SERVICE = 'Lingo'

/** Only non-empty secrets — never cache `null` (avoids stale miss after bootstrap / set). */
const secretCache = new Map<SecretProviderId, string>()

function rememberSecret(provider: SecretProviderId, value: string | null): void {
  if (value) {
    secretCache.set(provider, value)
  } else {
    secretCache.delete(provider)
  }
}

function account(provider: SecretProviderId): string {
  return `lingo.${provider}`
}

function wrapKeytarError(action: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error)
  return new Error(`Failed to ${action} key (${detail})`)
}

async function readStoredSecret(provider: SecretProviderId): Promise<string | null> {
  const value = await keytar.getPassword(SERVICE, account(provider))
  if (!value) return null
  if (isMaskedSecretDisplay(value)) {
    console.warn(`[lingo] Removing invalid masked ${provider} key from secure storage`)
    secretCache.delete(provider)
    try {
      await keytar.deletePassword(SERVICE, account(provider))
    } catch {
      // ignore
    }
    return null
  }
  return normalizeBearerApiKey(value)
}

export async function getSecretStatus(provider: SecretProviderId): Promise<SecretStatus> {
  try {
    const value = await readStoredSecret(provider)
    return {
      provider,
      isSet: Boolean(value),
      masked: value ? maskSecretForDisplay(value) : undefined
    }
  } catch (error) {
    throw wrapKeytarError('read', error)
  }
}

const KEYTAR_TIMEOUT_MS = 8_000

async function withKeytarTimeout<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${KEYTAR_TIMEOUT_MS}ms`)), KEYTAR_TIMEOUT_MS)
    })
  ])
}

export async function warmSecretsCache(): Promise<void> {
  const providers: SecretProviderId[] = ['openrouter', 'custom-llm']
  await Promise.all(
    providers.map(async (provider) => {
      try {
        const value = await withKeytarTimeout(`keytar read (${provider})`, () =>
          readStoredSecret(provider)
        )
        rememberSecret(provider, value)
      } catch (error) {
        console.warn(`[lingo] Could not warm secret cache for ${provider}:`, error)
        secretCache.delete(provider)
      }
    })
  )
}

export async function setSecret(provider: SecretProviderId, value: string): Promise<SecretStatus> {
  const trimmed = normalizeBearerApiKey(value)
  if (!trimmed) throw new Error('EMPTY_KEY')
  if (isMaskedSecretDisplay(trimmed)) {
    throw new Error('Enter the full API key, not the masked preview.')
  }

  try {
    await keytar.setPassword(SERVICE, account(provider), trimmed)
    rememberSecret(provider, trimmed)
    return getSecretStatus(provider)
  } catch (error) {
    throw wrapKeytarError('save', error)
  }
}

export async function clearSecret(provider: SecretProviderId): Promise<SecretStatus> {
  try {
    await keytar.deletePassword(SERVICE, account(provider))
    secretCache.delete(provider)
    return getSecretStatus(provider)
  } catch (error) {
    throw wrapKeytarError('delete', error)
  }
}

export async function getSecret(provider: SecretProviderId): Promise<string | null> {
  const cached = secretCache.get(provider)
  if (cached) {
    if (!isMaskedSecretDisplay(cached)) return normalizeBearerApiKey(cached)
    secretCache.delete(provider)
  }

  try {
    const value = await readStoredSecret(provider)
    rememberSecret(provider, value)
    return value
  } catch (error) {
    throw wrapKeytarError('read', error)
  }
}

/** One-time import from legacy secrets.json (safeStorage), then remove the file. */
async function migrateLegacySecretsFile(): Promise<void> {
  const file = path.join(app.getPath('userData'), 'secrets.json')
  if (!fs.existsSync(file)) return

  try {
    const raw = fs.readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw) as { plain?: Record<string, string> }
    const openrouter = parsed.plain?.openrouter?.trim()
    if (openrouter) {
      const existing = await keytar.getPassword(SERVICE, account('openrouter'))
      if (!existing) {
        await keytar.setPassword(SERVICE, account('openrouter'), openrouter)
      }
      rememberSecret('openrouter', existing ?? openrouter)
    }
  } catch {
    // ignore corrupt legacy file
  } finally {
    try {
      fs.unlinkSync(file)
    } catch {
      // ignore
    }
  }
}

function loadDevEnvFile(): void {
  if (app.isPackaged) return
  const file = path.join(process.cwd(), '.env')
  if (!fs.existsSync(file)) return
  try {
    const text = fs.readFileSync(file, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const name = trimmed.slice(0, eq).trim()
      if (name !== 'LINGO_OPENROUTER_API_KEY') continue
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (value && !process.env.LINGO_OPENROUTER_API_KEY) {
        process.env.LINGO_OPENROUTER_API_KEY = value
      }
    }
  } catch {
    // ignore unreadable .env in dev
  }
}

export async function loadEnvBootstrap(): Promise<void> {
  loadDevEnvFile()
  try {
    await withKeytarTimeout('legacy secrets migrate', () => migrateLegacySecretsFile())
  } catch (error) {
    console.warn('[lingo] Legacy secrets migrate skipped:', error)
  }

  const key = process.env.LINGO_OPENROUTER_API_KEY?.trim()
  if (!key) return

  try {
    const existing = await withKeytarTimeout('keytar read (openrouter bootstrap)', () =>
      keytar.getPassword(SERVICE, account('openrouter'))
    )
    if (existing) {
      rememberSecret('openrouter', existing)
      return
    }

    await withKeytarTimeout('keytar write (openrouter bootstrap)', () =>
      keytar.setPassword(SERVICE, account('openrouter'), key)
    )
    rememberSecret('openrouter', key)
  } catch (error) {
    console.warn('[lingo] OpenRouter env bootstrap skipped:', error)
  }
}
