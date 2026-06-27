/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createDeferredResizeObserver } from './observe-element-resize'

describe('createDeferredResizeObserver', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private callback: ResizeObserverCallback

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback
        }

        observe() {
          this.callback([], this as unknown as ResizeObserver)
        }

        disconnect() {}
        unobserve() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defers callback to the next animation frame', () => {
    const callback = vi.fn()
    const { observer, disconnect } = createDeferredResizeObserver(callback)
    observer.observe(document.createElement('div'))

    expect(callback).not.toHaveBeenCalled()

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(callback).not.toHaveBeenCalled()
        requestAnimationFrame(() => {
          expect(callback).toHaveBeenCalledTimes(1)
          disconnect()
          resolve()
        })
      })
    })
  })
})
