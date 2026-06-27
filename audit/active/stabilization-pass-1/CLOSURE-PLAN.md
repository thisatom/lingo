# План закрытия аудитов (без регрессий)

**Цель:** закрыть домены stabilization-pass-1 по очереди — каждый спринт = один домен + тесты + ручной QA + статус ✅ в SUMMARY.

**Правило:** не смешивать несвязанные домены в одном PR/коммите; после каждого спринта — `npm test` + сценарии из Manual QA домена.

---

## Порядок спринтов

| Sprint | Домен | Почему сейчас | Файл аудита | Критерий закрытия |
|--------|--------|---------------|-------------|-------------------|
| **0** | Cross-cutting UX | Замечания пользователя блокируют работу | этот файл | Composer, Continue, scroll, update не ломают чат |
| **1** | App update | Сломан silent install / overlay | [app-update.md](./app-update.md) | Check → Install вручную; overlay только при install |
| **2** | Web search + agent | Плохой UI, слабый контекст | [web-search.md](./web-search.md), [local-web-search-agent.md](./local-web-search-agent.md) | Markdown enrich, UI sources, QA H1–H7 |
| **3** | Chat agent | Continue, stop, stream | [chat-agent.md](./chat-agent.md) | QA A1–A2, C3, D1, continue in-place |
| **4** | Conversation UI | Код, scroll, virtualizer | [conversation-ui.md](./conversation-ui.md) | Scroll follow, code blocks, 100+ msgs |
| **5** | Composer + voice | Mic/send, queue | [chat-composer.md](./voice-input.md) | C1–C3, mic+send order |
| **6** | Store + persistence | Delete, background stream | [store-persistence.md](./store-persistence.md) | D1–D3 integration |
| **7** | Streaming sanitize | Leaks, truncation | [streaming-sanitization.md](./streaming-sanitization.md) | I1–I3 |
| **8** | Settings, sidebar, electron | Остальное | respective `.md` | Smoke |
| **9** | Speech pipeline | STT/TTS | speech + TTS audits | SPEECH QA |
| **10** | Web preview, onboarding, attachments | Parity | respective `.md` | Best-effort |

---

## Sprint 0 — чеклист (закрыт 2026-06-27)

- [x] План CLOSURE-PLAN.md
- [x] App update: не auto-install при старте; Install по кнопке
- [x] Web search UI: visiting URL, inline source chips, link previews, sources panel
- [x] Composer: порядок `[mic] [send]` (уже был; подтверждено)
- [x] Continue: в ряду Copy/Speak; prompt «продолжи с места остановки»
- [x] Sprint 0 QA doc: [sprint-0-qa.md](./sprint-0-qa.md)
- [ ] Conversation scroll/code — **перенесено в Sprint 4** (см. [conversation-ui.md](./conversation-ui.md))

---

## Sprint 4 — Conversation UI (2026-06-27)

- [x] Auto-scroll smart follow (pause on user scroll up, not nested code) — existing + tests
- [x] Code blocks / sticky headers (`CHAT_NESTED_SCROLL_ATTR`) — existing
- [x] Virtualizer wired at 100+ msgs (`resolveVirtualizedTurnsActive`)
- [x] CU-P1-06 Speak/Continue on completed rows while agent busy
- [ ] Manual QA + domain closure in conversation-ui.md

**Priority fixes (2026-06-27):** Web search UI progress + collapsed sources; Continue end-to-end (Electron prefix + merged done text).

---

## Sprint 1 — App update (2026-06-27)

- [x] Overlay on IPC progress (toast + Settings install paths)
- [x] Download progress: GitHub asset size fallback
- [x] Idle/failed reset after dev external-open or error
- [x] Tests: `app-update.test.ts`, progress-label extended
- [ ] Manual QA S0-M1/M2 + platform install paths — [app-update.md](./app-update.md)

---

## Регрессии — как не ломать

1. **Минимальный diff** — один домен за раз (см. `.cursor/rules/stability.mdc`).
2. **Тест перед merge** — `npm test`; для ai-chat — затронутые integration tests.
3. **Manual QA** — минимум сценарии из `docs/CHAT_AGENT_MANUAL_QA.md` для sprint 3+.
4. **Не расширять keyword-intent** — только toggle + explicit search.
5. **Закрытие домена** — все Critical/High → fixed или deferred с ID; SUMMARY ✅; optional archive.

---

## Трекинг

Обновлять [SUMMARY.md](./SUMMARY.md) после каждого спринта.

**Agent-stable release gate:** A1–A2, B1–B3, C3, D1, E2, G1, H1, I1 (`CHAT_AGENT_MANUAL_QA.md`).
