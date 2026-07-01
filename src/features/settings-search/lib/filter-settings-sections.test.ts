import { describe, expect, it } from 'vitest'
import { filterSettingsSections } from './filter-settings-sections'

describe('filterSettingsSections', () => {
  it('returns all sections for empty query', () => {
    expect(filterSettingsSections('').map((section) => section.id)).toEqual([
      'general',
      'shortcuts',
      'appearance',
      'devices',
      'speech',
      'agent',
      'api'
    ])
  })

  it('filters by keyword metadata', () => {
    expect(filterSettingsSections('microphone').map((section) => section.id)).toEqual(['devices'])
  })
})
