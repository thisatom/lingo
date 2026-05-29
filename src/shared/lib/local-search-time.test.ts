import { describe, expect, it } from 'vitest'
import { normalizeCityForTimezoneLookup } from './local-search-time'

describe('normalizeCityForTimezoneLookup', () => {
  it('normalizes punctuation/parentheses without city dictionaries', () => {
    expect(normalizeCityForTimezoneLookup('  Екатеринбурге (ЕКБ). ')).toBe('Екатеринбурге')
    expect(normalizeCityForTimezoneLookup('  Berlin, DE. ')).toBe('Berlin, DE')
  })
})
