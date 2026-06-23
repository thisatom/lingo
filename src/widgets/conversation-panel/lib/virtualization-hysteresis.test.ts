import { describe, expect, it } from 'vitest'
import {
  resolveVirtualizedTurnsActive,
  VIRTUALIZE_MESSAGE_THRESHOLD,
  VIRTUALIZE_OFF_THRESHOLD
} from '@/widgets/conversation-panel/lib/virtualization-threshold'

describe('resolveVirtualizedTurnsActive', () => {
  it('activates at the on threshold', () => {
    expect(resolveVirtualizedTurnsActive(VIRTUALIZE_MESSAGE_THRESHOLD, false)).toBe(true)
  })

  it('deactivates below the off threshold', () => {
    expect(resolveVirtualizedTurnsActive(VIRTUALIZE_OFF_THRESHOLD - 1, true)).toBe(false)
  })

  it('keeps virtualization active between off and on thresholds (hysteresis)', () => {
    const between = VIRTUALIZE_OFF_THRESHOLD + 5
    expect(between).toBeLessThan(VIRTUALIZE_MESSAGE_THRESHOLD)
    expect(resolveVirtualizedTurnsActive(between, true)).toBe(true)
    expect(resolveVirtualizedTurnsActive(between, false)).toBe(false)
  })
})
