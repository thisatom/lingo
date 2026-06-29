import { describe, expect, it } from 'vitest'
import {
  formatDownloadSize,
  formatReleasePreview,
  formatUpdateTitle
} from './app-update-format'
import {
  isAppUpdateStepComplete,
  isAppUpdateStepCurrent
} from './app-update-phases'

describe('app-update-format', () => {
  it('formats update title from release name', () => {
    expect(
      formatUpdateTitle({ version: '1.2.0', name: 'Lingo 1.2', tag: 'v1.2.0' })
    ).toBe('Lingo 1.2')
    expect(formatUpdateTitle({ version: '1.2.0', name: 'v1.2.0', tag: 'v1.2.0' })).toBe(
      'Lingo v1.2.0'
    )
  })

  it('strips markdown and truncates release preview', () => {
    const body = '## Fixes\n\n**Chat** stability and [links](https://example.com).'
    expect(formatReleasePreview(body, 40)).toMatch(/Chat stability/)
  })

  it('formats download size', () => {
    expect(formatDownloadSize(512 * 1024)).toBe('512 KB')
    expect(formatDownloadSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})

describe('app-update-phases', () => {
  it('marks earlier steps complete', () => {
    expect(isAppUpdateStepComplete('checking', 'downloading')).toBe(true)
    expect(isAppUpdateStepCurrent('downloading', 'downloading')).toBe(true)
    expect(isAppUpdateStepComplete('downloading', 'checking')).toBe(false)
  })
})
