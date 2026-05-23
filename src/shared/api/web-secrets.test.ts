import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SECRET_PROVIDER_IDS } from '@/shared/types/secret-providers'
import { clearAllWebSecrets, setWebSecret } from './web-secrets'

function installLocalStorageStub(): void {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    }
  })
}

describe('clearAllWebSecrets', () => {
  beforeEach(() => {
    installLocalStorageStub()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clears every registered provider including custom-llm', async () => {
    for (const provider of SECRET_PROVIDER_IDS) {
      await setWebSecret(provider, `key-${provider}`)
    }

    clearAllWebSecrets()

    for (const provider of SECRET_PROVIDER_IDS) {
      expect(localStorage.getItem(`lingo.secret.${provider}`)).toBeNull()
    }
  })
})
