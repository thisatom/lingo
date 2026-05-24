import { describe, expect, it } from 'vitest'
import {
  needsInAppOnboarding,
  normalizeStoredSettingsForWelcome
} from './needs-welcome-window'

describe('needsInAppOnboarding', () => {
  it('shows when settings missing and no chats', () => {
    expect(
      needsInAppOnboarding({ version: 20, state: { onboardingCompleted: false } })
    ).toBe(true)
  })

  it('hides when onboarding completed', () => {
    expect(
      needsInAppOnboarding({ version: 20, state: { onboardingCompleted: true } })
    ).toBe(false)
  })

  it('hides when chats exist', () => {
    expect(
      needsInAppOnboarding(
        { version: 20, state: { onboardingCompleted: false } },
        { state: { chats: [{ id: '1' }] } }
      )
    ).toBe(false)
  })
})

describe('normalizeStoredSettingsForWelcome', () => {
  it('treats legacy settings as onboarding completed', () => {
    const normalized = normalizeStoredSettingsForWelcome({ version: 5, state: {} })
    expect(normalized?.state?.onboardingCompleted).toBe(true)
    expect(needsInAppOnboarding({ version: 5, state: {} })).toBe(false)
  })
})
