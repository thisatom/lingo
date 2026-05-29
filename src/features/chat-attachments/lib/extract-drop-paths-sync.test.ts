import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractPathsFromDropSync } from '@/features/chat-attachments/lib/extract-drop-paths-sync'

describe('extractPathsFromDropSync', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty on web platform', () => {
    vi.stubGlobal('window', { lingo: { platform: 'web' } })
    const dt = { files: [new File(['a'], 'a.txt')], getData: () => '' } as unknown as DataTransfer
    expect(extractPathsFromDropSync(dt)).toEqual([])
  })

  it('returns empty on electron (paths come from preload onDesktopFileDrop)', () => {
    vi.stubGlobal('window', { lingo: { platform: 'electron', files: {} } })
    const dt = {
      files: [new File(['x'], 'note.txt')],
      getData: () => ''
    } as unknown as DataTransfer
    expect(extractPathsFromDropSync(dt)).toEqual([])
  })
})
