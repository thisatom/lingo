import { describe, expect, it } from 'vitest'
import { isViewportAtBottom } from './chat-scroll-viewport'

describe('isViewportAtBottom', () => {
  it('treats exactly threshold px from bottom as at bottom', () => {
    const viewport = {
      scrollHeight: 1000,
      clientHeight: 400,
      scrollTop: 568
    } as HTMLElement
    expect(isViewportAtBottom(viewport, 32)).toBe(true)
    viewport.scrollTop = 567
    expect(isViewportAtBottom(viewport, 32)).toBe(false)
  })
})
