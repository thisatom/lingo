import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  clearLinkPreviewCacheForTests,
  fallbackLinkPreview,
  fetchLinkPreviewCached,
  isPreviewableHref
} from '@/shared/lib/use-link-preview'

describe('use-link-preview', () => {
  beforeEach(() => {
    clearLinkPreviewCacheForTests()
    vi.unstubAllGlobals()
  })

  it('isPreviewableHref accepts http(s) only', () => {
    expect(isPreviewableHref('https://example.com')).toBe(true)
    expect(isPreviewableHref('http://example.com/path')).toBe(true)
    expect(isPreviewableHref('ftp://example.com')).toBe(false)
    expect(isPreviewableHref(undefined)).toBe(false)
  })

  it('fallbackLinkPreview uses hostname as title', () => {
    expect(fallbackLinkPreview('https://www.example.com/page')).toEqual({
      url: 'https://www.example.com/page',
      siteName: 'example.com',
      title: 'example.com'
    })
  })

  it('fetchLinkPreviewCached returns fallback when link API unavailable', async () => {
    vi.stubGlobal('window', { lingo: undefined })

    const preview = await fetchLinkPreviewCached('https://news.example.org/article')

    expect(preview.title).toBe('news.example.org')
    expect(preview.siteName).toBe('news.example.org')
  })

  it('fetchLinkPreviewCached uses lingo link preview when available', async () => {
    const previewMock = vi.fn().mockResolvedValue({
      url: 'https://example.com',
      title: 'Example Title',
      description: 'Example description',
      siteName: 'example.com'
    })
    vi.stubGlobal('window', {
      lingo: {
        secrets: {},
        chat: {},
        link: { preview: previewMock }
      }
    })

    const preview = await fetchLinkPreviewCached('https://example.com')

    expect(previewMock).toHaveBeenCalledWith('https://example.com/')
    expect(preview.title).toBe('Example Title')
    expect(preview.description).toBe('Example description')
  })
})
