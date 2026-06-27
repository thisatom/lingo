# Audit: Electron / desktop shell

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Main process lifecycle, windows, titlebar
- IPC surface (`src/shared/types/ipc.ts`)
- macOS: icon, blank window, permissions
- CSP, preload bridge `window.lingo`
- Secrets, chat stream proxy

## Key paths

| Layer | Paths |
|-------|--------|
| Main | `electron/main/` |
| Preload | `electron/preload/index.ts` |
| Shared | `src/shared/api/lingo.ts`, `ipc.ts` |
| Docs | [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| ED-P1-01 | Critical | ✅ Fixed | macOS `icon.icns` load failure blocked startup (0.1.5) |
| ED-P1-02 | High | 🟡 | IPC errors mapped in STT/secrets/stream; link preview still silent |
| ED-P1-03 | Medium | Open | Titlebar + custom electron titlebar edge cases |
| ED-P1-04 | Medium | Open | Second instance / deep link if any |
| ED-P1-05 | Low | Open | Dev vs prod CSP differences |

## Pass 1 checklist

- [ ] Cold start macOS packaged build
- [ ] Window minimize/restore, fullscreen
- [ ] Preload exposes only intended API
- [ ] Main does not log secrets

## Pass 2

- IPC inventory: every channel has timeout/error contract
- Linux AppImage/deb smoke if in release matrix
