import { describe, expect, it, vi } from 'vitest'
import { createStreamContentSync } from './stream-content-sync'

describe('createStreamContentSync', () => {
  it('coalesces pushes into one sync per frame', () => {
    const frameQueue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frameQueue.push(cb)
      return frameQueue.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const sync = vi.fn()
    const batch = createStreamContentSync(sync)

    batch.push('a')
    batch.push('ab')
    batch.push('abc')
    frameQueue.forEach((cb) => cb(0))

    expect(sync).toHaveBeenCalledTimes(1)
    expect(sync).toHaveBeenCalledWith('abc')

    batch.flushNow('done')
    expect(sync).toHaveBeenLastCalledWith('done')

    vi.unstubAllGlobals()
  })
})
