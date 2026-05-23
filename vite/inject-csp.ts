import type { Plugin } from 'vite'
import {
  buildContentSecurityPolicy,
  resolveCspProfileFromHtmlPath,
  type CspMode
} from '../src/shared/config/content-security-policy'

function parseWebsearchOrigin(): string | null {
  const raw =
    process.env.VITE_WEBSEARCH_API_URL ??
    process.env.LINGO_WEBSEARCH_API_URL ??
    process.env.API_URL
  if (!raw) return 'http://localhost:3001'
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

const CSP_META_RE =
  /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/?>/i

export function injectContentSecurityPolicy(): Plugin {
  return {
    name: 'inject-content-security-policy',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const profile = resolveCspProfileFromHtmlPath(ctx.filename ?? ctx.path)
        if (!profile) return html

        const mode: CspMode = ctx.server ? 'development' : 'production'
        const policy = buildContentSecurityPolicy(profile, mode, {
          websearchOrigin: profile === 'web-main' ? parseWebsearchOrigin() : null
        })

        const escaped = policy.replace(/"/g, '&quot;')
        const meta = `<meta http-equiv="Content-Security-Policy" content="${escaped}" />`

        if (CSP_META_RE.test(html)) {
          return html.replace(CSP_META_RE, meta)
        }

        return html.replace(/<head[^>]*>/i, (head) => `${head}\n    ${meta}`)
      }
    }
  }
}
