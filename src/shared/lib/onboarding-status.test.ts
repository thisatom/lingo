import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHATS_STORAGE_KEY } from './needs-welcome-window'
import { resolveOnboardingCompleted } from './onboarding-status'

describe('resolveOnboardingCompleted', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return store.get(key) ?? null
      },
      setItem(key: string, value: string) {
        store.set(key, value)
      },
      removeItem(key: string) {
        store.delete(key)
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when saved flag is true', () => {
    expect(resolveOnboardingCompleted(true, false)).toBe(true)
  })

  it('infers true when chats exist in storage', () => {
    localStorage.setItem(
      CHATS_STORAGE_KEY,
      JSON.stringify({ state: { chats: [{ id: 'a' }] }, version: 1 })
    )
    expect(resolveOnboardingCompleted(false, false)).toBe(true)
  })

  it('uses fallback when no chats and flag undefined', () => {
    expect(resolveOnboardingCompleted(undefined, false)).toBe(false)
  })
})
