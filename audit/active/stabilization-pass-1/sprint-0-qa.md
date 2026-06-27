# Sprint 0 QA — Cross-cutting UX

**Date:** 2026-06-27  
**Scope:** App update gate, web search sources UI, Continue in action bar, composer mic/send order  
**Deferred to Sprint 4:** Conversation scroll follow, code blocks, virtualizer (see [conversation-ui.md](./conversation-ui.md))

---

## Automated tests

| Command | Result |
|---------|--------|
| `npm test` | **422 passed** / 422 (118 files) — 2026-06-27 |

Relevant unit/integration coverage (code-path contracts):

| Area | Tests |
|------|-------|
| App update progress label | `app-update-progress-label.test.ts` |
| Web search turn / messages | `web-search-turn.test.ts`, `web-search-messages.test.ts` |
| Assistant continuation | `assistant-continuation.test.ts` |
| Composer stack order | `composer-stack-panel.test.ts` |
| Chat scroll follow | `chat-scroll-follow.test.ts`, `chat-nested-scroll.test.ts` |

---

## Code-path verification (static)

| Item | Status | Evidence |
|------|--------|----------|
| App update: no silent install on startup | ✅ | `AppUpdateGate.tsx` — overlay only when `installing`; toast + user `startInstall` |
| Web search: visiting URL + inline chips + link preview panel | ✅ | `WebSearchSources.tsx` — spinner animate; >3 sources in bordered panel with X; hover/card previews |
| Continue in Copy/Speak action bar | ✅ | Desktop Continue fixed: `assistantContinuationPrefix` preserved in main sanitizer; merged `done` text |
| Composer order `[mic] [send]` | ✅ | `ChatComposer.tsx` — `VoiceRecordButton` before send `TooltipIconButton` |
| Scroll/code regressions | ➡️ Sprint 4 | See sprint-4 QA in `conversation-ui.md` |

---

## Manual QA checklist

Mark **needs manual verification** — desktop UI not exercised in this pass.

| ID | Scenario | Status |
|----|----------|--------|
| S0-M1 | App startup with update available → toast only, no full-screen block | needs manual verification |
| S0-M2 | Settings → Check for updates → Install → overlay + progress | needs manual verification |
| S0-M3 | Web search on → query shows “Searching…” then source chips + “Reading {host}…” | needs manual verification |
| S0-M4 | Stop mid-reply → Continue appears in action bar (not outside) → resumes | needs manual verification |
| S0-M5 | Composer: mic left of send when both visible | needs manual verification |
| S0-M6 | Send follow-up while agent busy → queues (tooltip) | needs manual verification |

---

## Sprint 0 closure

- [x] CLOSURE-PLAN Sprint 0 code items
- [x] Automated test baseline green
- [x] Code-path verification documented
- [ ] Manual desktop QA (S0-M1–M6) — owner sign-off pending
