# E2E tests (web preview)

End-to-end tests use [Playwright](https://playwright.dev/) against the **web preview** (`npm run dev:web`), not the Electron shell. This keeps CI fast and avoids IPC/keytar setup while covering most UI flows.

## Commands

```bash
npm run test:e2e:install   # once: download Chromium
npm run test:e2e           # headless (CI-friendly)
npm run test:e2e:ui        # interactive UI mode
```

Playwright starts `dev:web` on `127.0.0.1:5173` automatically unless a server is already running (local dev only).

## What is covered

| Flow | Spec |
|------|------|
| App load, composer, sidebar | `e2e/app-load.spec.ts` |
| Settings navigation + sidebar labels | `e2e/navigation.spec.ts`, `e2e/settings-sidebar.spec.ts` |
| Composer enable/send (mocked stream) | `e2e/chat-composer.spec.ts` |
| Sidebar new chat + list | `e2e/sidebar.spec.ts` |
| ResizeObserver console noise | `e2e/app-load.spec.ts` |

Tests seed `localStorage` (`lingo-settings`, `lingo-chats-v3`, dev OpenRouter key) before navigation so onboarding is skipped.

## Deferred (Electron-only)

- Welcome window / keytar secrets IPC
- Desktop file drop (`webUtils`)
- Whisper STT in main
- edge-tts / Azure TTS in main
- App update install flow
- Custom Electron titlebar

Electron smoke via `@playwright/test` `_electron` is possible after `npm run build` but is **not** in CI yet; see `docs/CHAT_AGENT_STABILITY_PLAN.md`.

## CI

`.github/workflows/ci.yml` runs `npm run test:e2e` after unit tests and `build:web`.
