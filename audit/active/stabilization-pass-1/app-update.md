# Audit: App update

**Pass 1:** ✅ Surface scan  
**Pass 2:** 🟡 Code complete — manual QA pending (2026-06-27)

## Scope

- GitHub releases flow: check, download, install (not electron-updater)
- Overlay UI vs toast — user-confirmed install only
- Settings section manual check
- Progress labels, restart gate

## Key paths

| Layer | Paths |
|-------|--------|
| Main | `electron/main/app-update.ts`, `app-update-install.ts`, `app-update-progress.ts` |
| Features | `src/features/app-update/` |
| App | `src/app/ui/AppUpdateGate.tsx` |
| Shared | `src/shared/lib/updater.ts`, `src/shared/types/ipc.ts` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| AU-P1-01 | High | ✅ Fixed | Overlay only after user Install — gate listens to IPC progress (toast + Settings) |
| AU-P1-02 | Medium | ✅ Fixed | Download % uses GitHub asset `downloadSize` when HTTP `content-length` missing |
| AU-P1-03 | Medium | 🟡 Verify | macOS install + relaunch permissions — manual on device |
| AU-P1-04 | Low | ✅ By design | Web preview stub returns `update: null`; install returns friendly error |
| AU-P1-05 | Low | ✅ Fixed | Settings + gate show error message from `check.error` / `failed` IPC phase |

## Pass 2 code fixes (2026-06-27)

| Fix | Detail |
|-----|--------|
| Overlay from Settings | `AppUpdateGate` shows overlay on any active IPC progress phase, not only toast `installing` flag |
| Early overlay | Fallback `{ phase: 'checking' }` while install IPC starts |
| Idle reset | `idle` / `failed` clears `installStartedRef` (dev unpackaged open-external path) |
| Progress bar | Shown only when `percent > 0` (no fake 4% sliver at start) |
| Download total | `downloadAsset(..., update.downloadSize)` fallback for percent |

## Tests

| File | Coverage |
|------|----------|
| `electron/main/app-update.test.ts` | `isVersionNewer` semver |
| `src/features/app-update/lib/app-update-progress-label.test.ts` | Labels, overlay visibility, 0% label |

**Baseline:** 429 tests pass (`npm test` 2026-06-27)

## Manual QA checklist

Mark **needs manual verification** — requires packaged desktop build and/or staged release.

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| S0-M1 | Startup toast, no block | Launch packaged app one version behind latest release | Toast “Update available” with Install/Later; chat usable; **no** full-screen overlay | needs manual verification |
| S0-M2 | Settings install + overlay | Settings → Software update → Check now → Install update | Full-screen overlay with spinner; label progresses checking → downloading (%) → installing → restarting; app quits/restarts | needs manual verification |
| AU-M3 | Toast install path | Dismiss toast, wait; click Install on toast | Same overlay flow as S0-M2 | needs manual verification |
| AU-M4 | No update | Check when on latest version | “Up to date” pill; no toast on startup | needs manual verification |
| AU-M5 | Offline / API error | Check with network blocked | Error pill + message in Settings; no crash | needs manual verification |
| AU-M6 | macOS silent zip | Install from .zip release on macOS | App quits; updated bundle opens (AU-P1-03) | needs manual verification — macOS only |
| AU-M7 | Windows silent exe | Install from .exe release | NSIS `/S` install; app quits | needs manual verification — Windows only |
| AU-M8 | Linux AppImage | Replace running AppImage | Old process exits; new image runs | needs manual verification — Linux only |

## Pass 2 closure

- [x] Code review + fixes (overlay, progress, idle reset)
- [x] Unit tests for version compare + progress labels
- [x] `npm test` green
- [ ] Manual QA S0-M1, S0-M2 (+ AU-M3–M8 as platform allows)
- [ ] Domain ✅ in SUMMARY after sign-off
