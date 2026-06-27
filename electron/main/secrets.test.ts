import { beforeEach, describe, expect, it, vi } from 'vitest'

const keytarStore = new Map<string, string>()

vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(async (service: string, account: string) => {
      return keytarStore.get(`${service}:${account}`) ?? null
    }),
    setPassword: vi.fn(async (service: string, account: string, password: string) => {
      keytarStore.set(`${service}:${account}`, password)
    }),
    deletePassword: vi.fn(async (service: string, account: string) => {
      keytarStore.delete(`${service}:${account}`)
    })
  }
}))

vi.mock('electron', () => ({
  app: {
    isPackaged: true,
    getPath: () => '/tmp/lingo-test'
  }
}))

import { clearSecret, getSecret, getSecretStatus, setSecret } from './secrets'

describe('secrets keytar round-trip', () => {
  beforeEach(() => {
    keytarStore.clear()
  })

  it('set → get → status round-trip for openrouter', async () => {
    await setSecret('openrouter', 'sk-test-key-12345')

    await expect(getSecret('openrouter')).resolves.toBe('sk-test-key-12345')

    const status = await getSecretStatus('openrouter')
    expect(status.isSet).toBe(true)
    expect(status.masked).toMatch(/2345/)
  })

  it('rejects masked placeholder on save', async () => {
    await expect(setSecret('openrouter', 'sk-••••••••1234')).rejects.toThrow(
      /full API key/i
    )
  })

  it('clear removes stored secret', async () => {
    await setSecret('custom-llm', 'local-key')
    await clearSecret('custom-llm')

    await expect(getSecret('custom-llm')).resolves.toBeNull()
    await expect(getSecretStatus('custom-llm')).resolves.toMatchObject({ isSet: false })
  })
})
