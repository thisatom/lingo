# Stabilization Pass 1 — Executive summary

**Date:** 2026-06-24  
**Phase:** Surface scan (Pass 1) — **in progress**  
**Tests baseline:** 460 passing (`npm test`) + Playwright e2e · Pass 2 batch 2026-06-27  
**Goal:** Bug fixes + UI/logic stability across all product domains.

---

## Pass 1 status by domain

| Domain | File | Pass 1 | Pass 2 | Notes |
|--------|------|--------|--------|-------|
| Chat agent | [chat-agent.md](./chat-agent.md) | 🟡 | ✅ | CA-02 Continue fixed; integration tests; manual QA remains |
| Web search | [web-search.md](./web-search.md) | ✅ | 🟡 QA | Pass 2 + Markdown enrich; toggle-only gate |
| Agent × search | [local-web-search-agent.md](./local-web-search-agent.md) | ✅ | 🟡 QA | Prompt injection, AI SDK tool, Jina/Readability |
| Speech (STT) | [speech-recognition.md](./speech-recognition.md) | 🟡 | 🟡 | STT errors surfaced; dead hook removed; STT-P1-04 open |
| TTS | [text-to-speech.md](./text-to-speech.md) | 🟡 | ⬜ | Agent vs reply TTS boundaries |
| Voice input | [voice-input.md](./voice-input.md) | 🟡 | ⬜ | Composer mic + live conversation |
| Settings | [settings.md](./settings.md) | 🟡 | 🟡 | SET-P1-02–06 fixed; manual QA open |
| App update | [app-update.md](./app-update.md) | ✅ | 🟡 QA | Pass 2 code done; overlay on install; manual S0-M1/M2 pending |
| Store | [store-persistence.md](./store-persistence.md) | 🟡 | 🟡 | SP-P1-01/02 fixed; SP-P1-03 deferred |
| Conversation UI | [conversation-ui.md](./conversation-ui.md) | 🟡 | 🟡 | Scroll anchor + virtualizer restore; manual QA open |
| Composer | [chat-composer.md](./chat-composer.md) | 🟡 | 🟡 | CC-P1-05 placeholders; CC-P1-06 API key gate |
| Streaming sanitize | [streaming-sanitization.md](./streaming-sanitization.md) | 🟡 | 🟡 | SS-P1-05 retroactive clean; SS-P1-06 verified |
| Sidebar / chats | [sidebar-chats.md](./sidebar-chats.md) | 🟡 | 🟡 | Background stream indicator; nested button fixed |
| Electron | [electron-desktop.md](./electron-desktop.md) | 🟡 | 🟡 | ED-P1-02 partial; link preview errors open |
| Web preview | [web-preview.md](./web-preview.md) | 🟡 | ⬜ | Parity gaps |
| Onboarding | [onboarding.md](./onboarding.md) | 🟡 | ⬜ | Welcome flow |
| Translate | [message-translate.md](./message-translate.md) | 🟡 | ⬜ | Reply translate menu |
| Attachments | [chat-attachments.md](./chat-attachments.md) | 🟡 | ⬜ | Images, paste, queue |

Legend: 🟡 Pass 1 checklist drafted · ✅ closed · ⬜ not started

---

## Recommended Pass 2 order (stability-first)

1. **chat-agent** + **streaming-sanitization** — ядро продукта, недавние изменения
2. **conversation-ui** + **chat-composer** — видимые UX баги
3. **web-search** — качество ответов
4. **speech-recognition** + **voice-input** + **text-to-speech** — speech pipeline
5. **store-persistence** — данные пользователя
6. **settings** + **sidebar-chats** + **electron-desktop**
7. **app-update**, **web-preview**, **onboarding**, **translate**, **attachments**

---

## Cross-cutting risks (Pass 1)

| ID | Sev | Area | Issue |
|----|-----|------|-------|
| X-1 | High | Agent | Partial stop/continue/reconnect — needs full manual QA matrix |
| X-2 | High | Sanitize | Model leak strings (safety undefined, IRP_MJ garbage) — filter added, old messages remain |
| X-3 | Medium | Scroll | Nested code-block scroll vs chat auto-follow — fixed, verify long streams |
| X-4 | Medium | Settings | `FieldContextMenu` wrapper broke row layout — fixed, scan other forms |
| X-5 | Medium | macOS | `icon.icns` load failure aborted startup — fixed in 0.1.5, verify on device |

---

## Closure criteria (whole stabilization)

- [ ] Every domain file: Pass 2 complete, issues triaged (fix / defer / accept)
- [ ] `docs/CHAT_AGENT_MANUAL_QA.md` executed on desktop
- [ ] `npm test` green; no new Critical/High open
- [ ] Release smoke: macOS + Linux (or primary targets)
- [ ] Folder archived under `audit/archive/YYYY-MM-DD-stabilization-pass-1/`
