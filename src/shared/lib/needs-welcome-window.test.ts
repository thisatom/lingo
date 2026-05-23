import { describe, expect, it } from 'vitest'
import {
  evaluateWelcomeNeeded,
  needsInAppOnboarding,
  needsWelcomeWindow,
  normalizeStoredSettingsForWelcome,
  parseWelcomePersistPayload
} from './needs-welcome-window'

describe('needsWelcomeWindow', () => {
  it('returns true when settings are missing (first install)', () => {
    expect(needsWelcomeWindow(null)).toBe(true)
  })

  it('returns false when settings blob exists even if onboarding is incomplete', () => {
    expect(
      needsWelcomeWindow({ version: 20, state: { onboardingCompleted: false } })
    ).toBe(false)
  })

  it('returns false for legacy settings before onboarding flag', () => {
    expect(needsWelcomeWindow({ version: 12, state: {} })).toBe(false)
  })

  it('returns false when chats exist', () => {
    expect(
      needsWelcomeWindow(null, { state: { chats: [{ id: '1' }] } })
    ).toBe(false)
  })
})

describe('needsInAppOnboarding', () => {
  it('returns true when onboarding is not completed', () => {
    expect(
      needsInAppOnboarding({ version: 20, state: { onboardingCompleted: false } })
    ).toBe(true)
  })

  it('returns false when onboarding is completed', () => {
    expect(
      needsInAppOnboarding({ version: 20, state: { onboardingCompleted: true } })
    ).toBe(false)
  })

  it('returns false when chats exist', () => {
    expect(
      needsInAppOnboarding(
        { version: 20, state: { onboardingCompleted: false } },
        { state: { chats: [{ id: '1' }] } }
      )
    ).toBe(false)
  })
})

describe('normalizeStoredSettingsForWelcome', () => {
  it('marks legacy users as onboarding complete (migrate v13)', () => {
    const normalized = normalizeStoredSettingsForWelcome({ version: 5, state: {} })
    expect(normalized?.state?.onboardingCompleted).toBe(true)
    expect(needsWelcomeWindow({ version: 5, state: {} })).toBe(false)
    expect(needsInAppOnboarding({ version: 5, state: {} })).toBe(false)
  })
})

describe('parseWelcomePersistPayload / evaluateWelcomeNeeded', () => {
  it('fail-closed on parse errors', () => {
    expect(parseWelcomePersistPayload({ error: 'settings_parse' }).ok).toBe(false)
    expect(
      evaluateWelcomeNeeded(parseWelcomePersistPayload({ error: 'settings_parse' }))
    ).toBe(false)
  })

  it('shows welcome window only when settings were never saved', () => {
    const read = parseWelcomePersistPayload({ settings: null, chats: null })
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(evaluateWelcomeNeeded(read)).toBe(true)
  })

  it('skips welcome window when settings exist but onboarding is incomplete', () => {
    const read = parseWelcomePersistPayload({
      settings: { version: 20, state: { onboardingCompleted: false } },
      chats: null
    })
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(evaluateWelcomeNeeded(read)).toBe(false)
    expect(needsInAppOnboarding(read.data.settings, read.data.chats)).toBe(true)
  })

  it('skips welcome for completed onboarding', () => {
    const read = parseWelcomePersistPayload({
      settings: { version: 19, state: { onboardingCompleted: true } },
      chats: null
    })
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(evaluateWelcomeNeeded(read)).toBe(false)
  })
})
