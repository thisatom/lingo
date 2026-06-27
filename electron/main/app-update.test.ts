import { describe, expect, it } from 'vitest'
import { isVersionNewer } from './app-update'

describe('isVersionNewer', () => {
  it('compares semver segments numerically', () => {
    expect(isVersionNewer('1.2.0', '1.1.9')).toBe(true)
    expect(isVersionNewer('1.10.0', '1.9.0')).toBe(true)
    expect(isVersionNewer('2.0.0', '1.99.99')).toBe(true)
    expect(isVersionNewer('1.0.0', '1.0.0')).toBe(false)
    expect(isVersionNewer('1.0.0', '1.0.1')).toBe(false)
  })

  it('strips v prefix and prerelease suffix', () => {
    expect(isVersionNewer('v2.0.0', '1.0.0')).toBe(true)
    expect(isVersionNewer('2.0.0-beta', '1.9.0')).toBe(true)
  })
})
