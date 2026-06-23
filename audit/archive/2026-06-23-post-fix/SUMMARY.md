# Post-fix audit (archived)

**Closed:** 2026-06-23  
**Baseline:** [`2026-05-28-baseline`](../2026-05-28-baseline/) (commit `62a1287`)  
**Tests:** 266 passing

Все пункты baseline закрыты кодом или приняты как product-by-design. Manual QA покрыт автотестами (см. ниже).

---

## Resolved — Critical / High

| ID | Notes |
|----|-------|
| P0-1 | Background streams сохраняются при смене чата |
| C-1, C-2 | Stream-safe deltas + markdown при live stream |
| WS-01, WS-03 | Toggle off по умолчанию + intent gate + copy |
| WS-02 | Force-search всегда запускает реальный search pipeline |
| H-1 UI | Virtualizer `getItemKey` + remeasure |
| H-1 stream | Web-search retry merge prefix |
| H-3 scroll | Auto-follow уважает viewport при scroll up |
| H-3 thinking | `ThinkingBlock` → `variant="thinking"` |
| P1-2, P1-3 | Delete-chat abort scope + composer attachments cleanup |

---

## Resolved — Medium / Low

| ID | Notes |
|----|-------|
| WS-04 | Attachments/images блокируют search только на текущем turn |
| WS-06 | Custom endpoint: failed search → regular completion |
| WS-07 | `buildWebSearchQuery()` — query без «search the web for…» |
| WS-08, WS-10 | Dead param removed; tightened force-search regex |
| WS-11 | Search branching tests в `openrouter-chat-stream.test.ts` |
| WS-12 | `completion-quality` в `tsconfig.node.json` |
| M-1 (UI) | Tail layout deps + tail scroll signature |
| M-2 (UI) | `turnIndex` в memo equality |
| M-3 (UI) | Virtualization hysteresis (100 on / 90 off) |
| M-4 (UI) | Virtualization остаётся включённой в edit mode |
| M-5 (UI) | `followBottom()` при смене pipeline stage |
| M-6 | Search UI в tail scroll signature |
| M-1 (stream) | `useStreamMarkdownValue` — rAF + min interval |
| M-2, M-3 (stream) | Stream-safe path не трогает orphan fences |
| M-4 (stream) | `mergeContinuationAnswer` word boundary |
| H-2 (UI) | `estimateTurnHeightPx`: attachments, fences, math, sources |
| H-2 (stream) | Final strip только на `done`; stream-safe до этого |
| L-1, L-2, L-4 | Memo signatures для attachments/sources/content |
| L-4 (UI) | Virtualizer `overscan: 5` |
| L-5 | Убран `[contain:layout_style]` с historical turns |
| L-7 | `areConversationTurnPropsEqual` unit tests |
| P2-4 … P2-7 | Orphan tail, stream sync, delete handlers |
| L-3 (stream) | `accumulatedText` вместо `rawText` |

---

## Accepted by design

| ID | Decision |
|----|----------|
| WS-05 | Factual auto-search только при включённом toggle — намеренно |
| M-5 (stream) | Bare URL lines удаляются финальным strip |
| L-2 (stream) | `normalizeMarkdown` на user messages — paste UX |
| WS-09 | Комментарии в `local-web-search-progress.ts` актуальны |

---

## Manual QA → automated coverage

| Scenario | Covered by |
|----------|------------|
| Long stream — no mid-word cuts | `strip-assistant-role-markup.test.ts`, `openrouter-chat-stream.test.ts` |
| Web search ON — factual yes, small talk no | `web-search-intent.test.ts`, `openrouter-chat-stream.test.ts` |
| Force-search with toggle OFF | `openrouter-chat-stream.test.ts` |
| Cross-chat background stream | `run-agent-turn.background-stream.integration.test.ts` |
| Delete chat during stream | `stop-agent-on-chat-delete.test.ts`, `chat-delete-effects.test.ts` |
| Scroll up during stream | `chat-scroll-follow.test.ts` |
| 100+ msgs: checkpoint edit, scroll restore, hysteresis | `virtualizer-turn-keys.test.ts`, `virtualization-hysteresis.test.ts` |
| Custom LLM + search ON — fallback | `openrouter-chat-stream.test.ts` (custom endpoint branch) |

---

## Archive index (baseline reports)

- [streaming-sanitization.md](../2026-05-28-baseline/streaming-sanitization.md)
- [web-search-agent.md](../2026-05-28-baseline/web-search-agent.md)
- [ui-performance.md](../2026-05-28-baseline/ui-performance.md)
- [store-state.md](../2026-05-28-baseline/store-state.md)
