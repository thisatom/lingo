import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  resolveCspProfileFromHtmlPath
} from './content-security-policy'

describe('content-security-policy', () => {
  it('resolves profiles from html paths', () => {
    expect(resolveCspProfileFromHtmlPath('/proj/index.html')).toBe('electron-main')
    expect(resolveCspProfileFromHtmlPath('/proj/index.web.html')).toBe('web-main')
  })

  it('electron prod omits openrouter and unsafe-eval', () => {
    const csp = buildContentSecurityPolicy('electron-main', 'production')
    expect(csp).not.toContain('openrouter.ai')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain('speech.googleapis.com')
  })

  it('electron dev allows vite HMR and react preamble', () => {
    const csp = buildContentSecurityPolicy('electron-main', 'development')
    expect(csp).toContain('unsafe-eval')
    expect(csp).toContain('unsafe-inline')
    expect(csp).toContain('ws://localhost:*')
  })

  it('electron prod blocks unsafe script sources', () => {
    const csp = buildContentSecurityPolicy('electron-main', 'production')
    expect(csp).toMatch(/script-src 'self'/)
    expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/)
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/)
  })

  it('web prod includes openrouter', () => {
    const csp = buildContentSecurityPolicy('web-main', 'production', {
      websearchOrigin: 'http://localhost:3001'
    })
    expect(csp).toContain('openrouter.ai')
    expect(csp).toContain('http://localhost:3001')
  })
})
