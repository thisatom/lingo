# Audit: Web preview parity

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- `npm run dev:web` / `build:web`
- `browser-lingo` API vs Electron `window.lingo`
- STT/TTS/secrets limitations
- Chat agent stream without main proxy

## Key paths

| Layer | Paths |
|-------|--------|
| API | `src/shared/api/browser-lingo.ts` |
| Secrets | `src/shared/api/web-secrets.ts` |
| Build | `index.web.html`, vite web config |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| WP-P1-01 | High | Open | OpenRouter from renderer — dev only, document risk |
| WP-P1-02 | Medium | Open | No Whisper — Web Speech quality variance |
| WP-P1-03 | Medium | Open | App update stubs |
| WP-P1-04 | Low | Open | Feature flags / UI hides desktop-only controls |
| WP-P1-05 | Medium | Open | Stream reconnect behavior same as desktop? |

## Pass 1 checklist

- [ ] Web dev: send message, stream response
- [ ] Key in localStorage works for dev
- [ ] Mic uses browser STT
- [ ] No crash when calling desktop-only IPC

## Pass 2

- Document explicit parity matrix in this file after audit
