import { describe, expect, it } from 'vitest'
import { shouldCollapseSidebarOnResize } from './sidebar-panel-resize'

describe('shouldCollapseSidebarOnResize', () => {
  const threshold = 10

  it('does not collapse on first resize after mount', () => {
    expect(shouldCollapseSidebarOnResize(5, null, threshold)).toBe(false)
  })

  it('does not collapse while expanding from collapsed (size increasing)', () => {
    expect(shouldCollapseSidebarOnResize(3, 0, threshold)).toBe(false)
    expect(shouldCollapseSidebarOnResize(8, 3, threshold)).toBe(false)
    expect(shouldCollapseSidebarOnResize(12, 8, threshold)).toBe(false)
  })

  it('collapses when user shrinks below threshold', () => {
    expect(shouldCollapseSidebarOnResize(9, 15, threshold)).toBe(true)
    expect(shouldCollapseSidebarOnResize(5, 12, threshold)).toBe(true)
  })

  it('does not collapse when shrinking but still above threshold', () => {
    expect(shouldCollapseSidebarOnResize(11, 20, threshold)).toBe(false)
  })
})
