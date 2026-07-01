/**
 * Content-Security-Policy sources for HTML shells.
 * Injected at build/dev time by `vite/inject-csp.ts` (mode-aware).
 */

export type CspProfile = 'electron-main' | 'web-main'

export type CspMode = 'development' | 'production'

const OPENROUTER = [
  'https://openrouter.ai',
  'https://api.openrouter.ai',
  'https://*.openrouter.ai'
]

/** Chromium Web Speech API (browser STT in renderer). */
const GOOGLE_SPEECH = [
  'https://www.google.com',
  'https://*.google.com',
  'https://speech.googleapis.com',
  'wss://www.google.com',
  'wss://*.google.com'
]

/** Edge TTS in the web build (`web-tts.ts`). */
const BING_SPEECH = [
  'https://speech.platform.bing.com',
  'https://*.speech.platform.bing.com',
  'wss://speech.platform.bing.com',
  'wss://*.speech.platform.bing.com'
]

const VITE_DEV_CONNECT = [
  'http://localhost:*',
  'http://127.0.0.1:*',
  'ws://localhost:*',
  'ws://127.0.0.1:*'
]

function directive(name: string, sources: string[]): string {
  const unique = [...new Set(sources)]
  return `${name} ${unique.join(' ')}`
}

function joinDirectives(parts: string[]): string {
  return parts.join('; ')
}

/** Vite React Refresh preamble needs inline scripts in dev; HMR client needs unsafe-eval unless disabled. */
function devScriptSrc(base: string[], options: { allowEval?: boolean } = {}): string {
  const sources = [...base, "'unsafe-inline'"]
  if (options.allowEval !== false) {
    sources.push("'unsafe-eval'")
  }
  return directive('script-src', sources)
}

function devConnectSrc(base: string[]): string {
  return directive('connect-src', [...base, ...VITE_DEV_CONNECT])
}

/** Desktop renderer — AI/STT/TTS go through main IPC; renderer only needs Web Speech + assets. */
function electronMainCsp(mode: CspMode, options: { viteHmr?: boolean } = {}): string {
  const allowViteEval = mode === 'development' && options.viteHmr !== false
  const connect =
    mode === 'development'
      ? devConnectSrc(["'self'", ...GOOGLE_SPEECH])
      : directive('connect-src', ["'self'", ...GOOGLE_SPEECH])

  return joinDirectives([
    directive('default-src', ["'self'"]),
    mode === 'development'
      ? devScriptSrc(["'self'"], { allowEval: allowViteEval })
      : directive('script-src', ["'self'"]),
    directive('worker-src', ["'self'", 'blob:']),
    directive('style-src', ["'self'", "'unsafe-inline'"]),
    directive('font-src', ["'self'", 'data:']),
    directive('img-src', ["'self'", 'data:', 'blob:', 'https:']),
    connect,
    directive('media-src', ["'self'", 'blob:', 'data:', 'file:'])
  ])
}

/** Browser build — renderer calls OpenRouter, link preview, optional custom LLM base URLs. */
function webMainCsp(mode: CspMode, websearchOrigin: string | null, options: { viteHmr?: boolean } = {}): string {
  const allowViteEval = mode === 'development' && options.viteHmr !== false
  const connectBase = [
    "'self'",
    ...OPENROUTER,
    ...BING_SPEECH,
    ...GOOGLE_SPEECH,
    ...(websearchOrigin ? [websearchOrigin] : []),
    'https:'
  ]

  const connect =
    mode === 'development' ? devConnectSrc(connectBase) : directive('connect-src', connectBase)

  return joinDirectives([
    directive('default-src', ["'self'"]),
    mode === 'development'
      ? devScriptSrc(["'self'"], { allowEval: allowViteEval })
      : directive('script-src', ["'self'"]),
    directive('worker-src', ["'self'", 'blob:']),
    directive('style-src', ["'self'", "'unsafe-inline'"]),
    directive('font-src', ["'self'", 'data:']),
    directive('img-src', ["'self'", 'data:', 'blob:', 'https:', 'http:']),
    connect,
    directive('media-src', ["'self'", 'blob:', 'data:', 'https:'])
  ])
}

export function resolveCspProfileFromHtmlPath(filename: string): CspProfile | null {
  const base = filename.replace(/\\/g, '/')
  if (base.endsWith('index.web.html')) return 'web-main'
  if (base.endsWith('index.html')) return 'electron-main'
  return null
}

export function buildContentSecurityPolicy(
  profile: CspProfile,
  mode: CspMode,
  options: { websearchOrigin?: string | null; viteHmr?: boolean } = {}
): string {
  switch (profile) {
    case 'electron-main':
      return electronMainCsp(mode, { viteHmr: options.viteHmr })
    case 'web-main':
      return webMainCsp(mode, options.websearchOrigin ?? null, { viteHmr: options.viteHmr })
    default:
      return electronMainCsp(mode, { viteHmr: options.viteHmr })
  }
}

/** Static fallback for `index.html` when the Vite CSP plugin does not run. */
export const ELECTRON_RENDERER_CSP_FALLBACK = buildContentSecurityPolicy(
  'electron-main',
  'production'
)
