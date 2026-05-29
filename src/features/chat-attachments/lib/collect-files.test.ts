import { describe, expect, it } from 'vitest'
import {
  dedupeFiles,
  extractLocalPathsFromDataTransfer,
  fileUriToLocalPath
} from '@/features/chat-attachments/lib/collect-files'

describe('fileUriToLocalPath', () => {
  it('decodes Windows file URLs', () => {
    expect(fileUriToLocalPath('file:///C:/Users/test/doc.txt')).toBe('C:/Users/test/doc.txt')
  })

  it('decodes Unix file URLs', () => {
    expect(fileUriToLocalPath('file:///home/user/a.md')).toBe('/home/user/a.md')
  })

  it('accepts plain Windows paths', () => {
    expect(fileUriToLocalPath('C:\\Users\\test\\a.txt')).toBe('C:\\Users\\test\\a.txt')
  })
})

describe('extractLocalPathsFromDataTransfer', () => {
  it('parses text/uri-list', () => {
    const dt = {
      getData: (type: string) =>
        type === 'text/uri-list' ? 'file:///C:/tmp/a.txt\n#comment\n' : ''
    } as DataTransfer

    expect(extractLocalPathsFromDataTransfer(dt)).toEqual(['C:/tmp/a.txt'])
  })
})

describe('dedupeFiles', () => {
  it('removes duplicate name/size/mtime', () => {
    const a = new File(['1'], 'a.txt', { type: 'text/plain', lastModified: 1 })
    const b = new File(['2'], 'a.txt', { type: 'text/plain', lastModified: 1 })
    expect(dedupeFiles([a, b])).toHaveLength(1)
  })
})
