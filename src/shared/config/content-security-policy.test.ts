import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  resolveCspProfileFromHtmlPath
} from './content-security-policy'

describe('content-security-policy', () => {
  it('resolves profiles from html paths', () => {
    expect(resolveCspProfileFromHtmlPath('/proj/index.html')).toBe('electron-main')
    expect(resolveCspProfileFromHtmlPath('/proj/welcome.html')).toBe('electron-welcome')
    expect(resolveCspProfileFromHtmlPath('/proj/index.web.html')).toBe('web-main')
    expect(resolveCspProfileFromHtmlPath('/proj/welcome-probe.html')).toBeNull()
  })

  it('electron prod omits openrouter and unsafe-eval', () => {
    const csp = buildContentSecurityPolicy('electron-main', 'production')
    expect(csp).not.toContain('openrouter.ai')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain('speech.googleapis.com')
  })

  it('electron dev allows vite HMR', () => {
    const csp = buildContentSecurityPolicy('electron-main', 'development')
    expect(csp).toContain('unsafe-eval')
    expect(csp).toContain('ws://localhost:*')
  })

  it('web prod includes openrouter', () => {
    const csp = buildContentSecurityPolicy('web-main', 'production', {
      websearchOrigin: 'http://localhost:3001'
    })
    expect(csp).toContain('openrouter.ai')
    expect(csp).toContain('http://localhost:3001')
  })
})
