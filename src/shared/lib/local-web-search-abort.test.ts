import { describe, expect, it, vi } from 'vitest'
import { performLocalWebSearch } from './local-web-search'

describe('performLocalWebSearch abort', () => {
  it('throws when aborted before search starts', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      performLocalWebSearch('test query', {
        signal: controller.signal,
        onProgress: vi.fn()
      })
    ).rejects.toMatchObject({ code: 'aborted' })
  })
})
