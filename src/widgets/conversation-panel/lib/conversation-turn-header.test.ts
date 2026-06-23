import { describe, expect, it } from 'vitest'
import {
  resolveUserHeaderStickyClass,
  resolveUserHeaderStickyZIndex,
  STICKY_HEADER_MAX_Z_INDEX
} from './conversation-turn-header'

describe('conversation-turn-header', () => {
  it('uses sticky positioning in flat mode', () => {
    expect(resolveUserHeaderStickyClass(false, true)).toBe('sticky top-0 pb-px')
  })

  it('disables sticky when editing or virtualized', () => {
    expect(resolveUserHeaderStickyClass(true, true)).toBe('relative')
    expect(resolveUserHeaderStickyClass(false, false)).toBe('relative')
  })

  it('caps z-index below chat scrollbar layer', () => {
    expect(resolveUserHeaderStickyZIndex(false, true, 1)).toBe(21)
    expect(resolveUserHeaderStickyZIndex(false, true, 25)).toBe(STICKY_HEADER_MAX_Z_INDEX)
    expect(resolveUserHeaderStickyZIndex(false, false, 25)).toBeUndefined()
  })
})
