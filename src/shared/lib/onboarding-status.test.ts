import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHATS_STORAGE_KEY } from './needs-welcome-window'
import { resolveOnboardingCompleted } from './onboarding-status'

describe('resolveOnboardingCompleted', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.get(key) ?? null
      },
      setItem(key: string, value: string) {
        this.store.set(key, value)
      },
      removeItem(key: string) {
        this.store.delete(key)
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
