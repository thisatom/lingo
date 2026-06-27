import { describe, expect, it } from 'vitest'
import {
  getAppUpdateProgressLabel,
  isAppUpdateOverlayVisible
} from './app-update-progress-label'

describe('app-update-progress-label', () => {
  it('returns English labels for active phases', () => {
    expect(getAppUpdateProgressLabel({ phase: 'downloading', version: '1.2.3', percent: 42 })).toBe(
      'Downloading v1.2.3… 42%'
    )
    expect(getAppUpdateProgressLabel({ phase: 'installing', version: '1.2.3' })).toBe(
      'Installing v1.2.3…'
    )
  })

  it('shows overlay only while update is active', () => {
    expect(isAppUpdateOverlayVisible({ phase: 'downloading', version: '1.0.0' })).toBe(true)
    expect(isAppUpdateOverlayVisible({ phase: 'checking' })).toBe(true)
    expect(isAppUpdateOverlayVisible({ phase: 'restarting', version: '1.0.0' })).toBe(true)
    expect(isAppUpdateOverlayVisible({ phase: 'failed', message: 'nope' })).toBe(false)
    expect(isAppUpdateOverlayVisible({ phase: 'idle' })).toBe(false)
    expect(isAppUpdateOverlayVisible(null)).toBe(false)
  })

  it('omits percent in label at 0% until bytes arrive', () => {
    expect(getAppUpdateProgressLabel({ phase: 'downloading', version: '1.2.3', percent: 0 })).toBe(
      'Downloading v1.2.3…'
    )
  })
})
