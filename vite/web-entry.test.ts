import { describe, expect, it } from 'vitest'
import { shouldRewritePathToWebHtml } from './web-entry'

describe('shouldRewritePathToWebHtml', () => {
  it('rewrites SPA routes to the web shell', () => {
    expect(shouldRewritePathToWebHtml('/')).toBe(true)
    expect(shouldRewritePathToWebHtml('/index.html')).toBe(true)
    expect(shouldRewritePathToWebHtml('/c/chat-1')).toBe(true)
    expect(shouldRewritePathToWebHtml('/settings/general')).toBe(true)
  })

  it('does not rewrite vite assets or modules', () => {
    expect(shouldRewritePathToWebHtml('/index.web.html')).toBe(false)
    expect(shouldRewritePathToWebHtml('/src/boot.tsx')).toBe(false)
    expect(shouldRewritePathToWebHtml('/@vite/client')).toBe(false)
    expect(shouldRewritePathToWebHtml('/icon.png')).toBe(false)
  })
})
