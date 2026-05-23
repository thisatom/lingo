import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import keytar from 'keytar'
import type { SecretProviderId, SecretStatus } from '../../src/shared/types/ipc'

const SERVICE = 'Lingo'

const secretCache = new Map<SecretProviderId, string | null>()

function account(provider: SecretProviderId): string {
  return `lingo.${provider}`
}

function maskKey(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function wrapKeytarError(action: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error)
  return new Error(`Failed to ${action} key (${detail})`)
}

export async function getSecretStatus(provider: SecretProviderId): Promise<SecretStatus> {
  try {
    const value = await keytar.getPassword(SERVICE, account(provider))
    return {
      provider,
      isSet: Boolean(value),
      masked: value ? maskKey(value) : undefined
    }
  } catch (error) {
    throw wrapKeytarError('read', error)
  }
}

export async function warmSecretsCache(): Promise<void> {
  const providers: SecretProviderId[] = ['openrouter', 'custom-llm']
  await Promise.all(
    providers.map(async (provider) => {
      try {
        const value = await keytar.getPassword(SERVICE, account(provider))
        secretCache.set(provider, value)
      } catch {
        secretCache.delete(provider)
      }
    })
  )
}

export async function setSecret(provider: SecretProviderId, value: string): Promise<SecretStatus> {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('EMPTY_KEY')

  try {
    await keytar.setPassword(SERVICE, account(provider), trimmed)
    secretCache.set(provider, trimmed)
    return getSecretStatus(provider)
  } catch (error) {
    throw wrapKeytarError('save', error)
  }
}

export async function clearSecret(provider: SecretProviderId): Promise<SecretStatus> {
  try {
    await keytar.deletePassword(SERVICE, account(provider))
    secretCache.set(provider, null)
    return getSecretStatus(provider)
  } catch (error) {
    throw wrapKeytarError('delete', error)
  }
}

export async function getSecret(provider: SecretProviderId): Promise<string | null> {
  if (secretCache.has(provider)) {
    return secretCache.get(provider) ?? null
  }
  try {
    const value = await keytar.getPassword(SERVICE, account(provider))
    secretCache.set(provider, value)
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

export async function loadEnvBootstrap(): Promise<void> {
  await migrateLegacySecretsFile()

  const key = process.env.LINGO_OPENROUTER_API_KEY?.trim()
  if (!key) return

  const existing = await keytar.getPassword(SERVICE, account('openrouter'))
  if (existing) return

  await keytar.setPassword(SERVICE, account('openrouter'), key)
}
