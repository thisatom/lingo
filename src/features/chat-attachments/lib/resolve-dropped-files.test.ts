import { describe, expect, it } from 'vitest'
import { mergeIpcResultsWithBlobs } from '@/features/chat-attachments/lib/resolve-dropped-files'
import type { DroppedFileReadResult } from '@/shared/types/ipc'

describe('mergeIpcResultsWithBlobs', () => {
  it('keeps IPC results and adds blobs for files not read from disk', () => {
    const ipcResults: DroppedFileReadResult[] = [
      {
        name: 'a.txt',
        mimeType: 'text/plain',
        sizeBytes: 1,
        kind: 'text',
        payload: 'hello'
      }
    ]
    const blob = new File(['world'], 'b.txt', { type: 'text/plain' })
    const merged = [
      new File(['hello'], 'a.txt', { type: 'text/plain' }),
      blob
    ]

    const files = mergeIpcResultsWithBlobs(ipcResults, merged)
    expect(files).toHaveLength(2)
    expect(files.map((f) => f.name).sort()).toEqual(['a.txt', 'b.txt'])
  })

  it('uses blob fallback when IPC returned nothing', () => {
    const blob = new File(['extra'], 'extra.txt', { type: 'text/plain' })
    const files = mergeIpcResultsWithBlobs([], [blob])
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('extra.txt')
  })

  it('does not duplicate when IPC already returned the same name', () => {
    const ipcResults: DroppedFileReadResult[] = [
      {
        name: 'dup.txt',
        mimeType: 'text/plain',
        sizeBytes: 3,
        kind: 'text',
        payload: 'ipc'
      }
    ]
    const blob = new File(['blob'], 'dup.txt', { type: 'text/plain' })

    const files = mergeIpcResultsWithBlobs(ipcResults, [blob])
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('dup.txt')
  })
})
