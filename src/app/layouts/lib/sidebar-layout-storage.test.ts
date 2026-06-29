import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clampSidebarWidthPx,
  clearLegacySidebarLayoutStorage,
  readSidebarCollapsed,
  readSidebarWidthPx,
  sidebarPanelConstraintCss,
  writeSidebarCollapsed,
  writeSidebarWidthPx
} from './sidebar-layout-storage'

function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    }
  }
}

describe('sidebar-layout-storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    clearLegacySidebarLayoutStorage()
  })

  it('clamps width between min and max', () => {
    expect(clampSidebarWidthPx(100)).toBe(240)
    expect(clampSidebarWidthPx(999)).toBe(360)
    expect(clampSidebarWidthPx(300)).toBe(300)
  })

  it('persists sidebar width and collapsed state', () => {
    writeSidebarWidthPx(300)
    writeSidebarCollapsed(true)
    expect(readSidebarWidthPx()).toBe(300)
    expect(readSidebarCollapsed()).toBe(true)
  })

  it('allows zero in panel constraint css for hidden sidebar', () => {
    expect(sidebarPanelConstraintCss(0)).toBe('0px')
    expect(sidebarPanelConstraintCss(240)).toBe('240px')
  })
})
