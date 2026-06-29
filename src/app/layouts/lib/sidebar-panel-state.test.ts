import { describe, expect, it } from 'vitest'
import { isSidebarPanelHidden } from './sidebar-panel-state'

describe('isSidebarPanelHidden', () => {
  it('treats near-zero widths as hidden', () => {
    expect(isSidebarPanelHidden(0)).toBe(true)
    expect(isSidebarPanelHidden(8)).toBe(true)
    expect(isSidebarPanelHidden(9)).toBe(false)
  })
})
