# Chat Audit — Executive Summary

**Commit audited:** `62a1287`  
**Overall:** Recent perf work is directionally correct, but **streaming sanitization is still inconsistent** (triple strip), **web search behavior diverges from UX copy**, and **chat switch kills background streams** (P0 vs docs).

---

## Top 10 Issues (by priority)

| # | ID | Sev | Area | Issue |
|---|-----|-----|------|-------|
| 1 | P0-1 | Critical | Store | Chat switch calls `stop({ force: true })` → aborts background stream; breaks QA D1/D3 and `BackgroundStreamHint` |
| 2 | C-1 | Critical | Streaming | `extractStreamDelta` runs full `stripAssistantRoleMarkup` **per SSE chunk** — reintroduces word/line truncation |
| 3 | C-2 | Critical | Streaming | `MarkdownContent` runs full strip during live stream (`parseThrottleMs > 0`) — contradicts stream-safe contract |
| 4 | WS-01 | Critical | Web search | Toggle ON (default) searches **every** text message including casual chat |
| 5 | WS-02 | High | Web search | `shouldForceWebSearch` with toggle OFF → research prompt only, **no actual search** |
| 6 | H-1 | High | UI | Virtualizer caches heights by index without `getItemKey` → wrong layout after checkpoint edit (100+ msgs) |
| 7 | P1-2 | High | Store | Delete chat with stale pipeline can `force: true` abort **another** chat's stream |
| 8 | P1-3 | High | Store | `deleteChat` does not clear `composerAttachmentsByChatId` |
| 9 | H-1 (stream) | High | Streaming | Web-search retry resets stream from empty instead of merging |
| 10 | M-1 | Medium | UI | Virtualized tail height deps incomplete after removing per-chunk measure loop |

---

## What improved (keep)

- `stripAssistantStreamSafeMarkup` API and final strip at stream `done`
- User messages: `variant="user"` skips assistant leak stripping
- rAF coalescing for scroll stick and virtualizer tail
- `ConversationTurn` / `AgentMessage` memo — tail always re-renders
- Per-chat pipeline registry + `syncPipelineUiForActiveChat`
- Clean removal of `local-search-*` (no broken imports)
- `completion-quality.ts` extraction — logic sound

---

## Recommended fix order

### Sprint 1 — Correctness

1. **P0-1** — `useAiChat.ts`: do not `force: true` on chat switch; preserve background stream
2. **C-1** — `openrouter-model.ts` / `extractStreamDelta`: unstripped deltas; stream-safe on cumulative text only
3. **C-2** — `markdown-content.tsx`: `stripAssistantStreamSafeMarkup` when streaming
4. **WS-02** — Run search pipeline when `shouldForceWebSearch` even if toggle off

### Sprint 2 — UX & data integrity

5. **WS-01** + **WS-03** — Default toggle off **or** intent gate; update settings copy
6. **P1-2** — Narrow `stopAgentOnChatDeleted` force-stop conditions
7. **P1-3** — Clear attachments in `deleteChat`
8. **H-1 (UI)** — `getItemKey` on virtualizer + remeasure on structural edits

### Sprint 3 — Polish & tests

9. **M-1, M-2** — Tail layout deps + `turnIndex` in memo equality
10. **H-4** — Add `openrouter-chat-stream.test.ts` per stability plan
11. **P2-4** — Orphan tail prune for partial assistant after stop
12. Cross-chat stream integration test (QA D1/D3)

---

## Test coverage gaps (cross-cutting)

| Missing | Enables regression |
|---------|------------------|
| `openrouter-chat-stream.test.ts` | C-1, C-2, web-search retry |
| Chat switch + background stream | P0-1 |
| `areConversationTurnPropsEqual` unit tests | M-2 sticky z-index |
| `useStreamMarkdownValue` timing tests | M-1 lag bounds |
| Virtualizer + checkpoint edit | H-1 UI |

---

## Manual QA checklist

- [ ] Stream long answer — no mid-word cuts at any frame
- [ ] «как у тебя дела» with web search ON — acceptable behavior (search vs no search per product decision)
- [ ] «search the web for X» with toggle OFF — must run real search
- [ ] Chat A streams → switch to B → A continues; `BackgroundStreamHint` works
- [ ] Delete chat during stream — clean stop, no wrong-chat abort
- [ ] 100+ messages: stream follow, checkpoint edit, scroll restore
- [ ] Short user prompt «а» — full bubble visible
- [ ] Thinking block — reasoning not stripped

---

## Report index

- [streaming-sanitization.md](./streaming-sanitization.md) — C-1, C-2, H-1–H-4, M-1–M-5
- [web-search-agent.md](./web-search-agent.md) — WS-01–WS-12
- [ui-performance.md](./ui-performance.md) — H-1–H-3, M-1–M-6
- [store-state.md](./store-state.md) — P0-1, P1-2, P1-3, P2 issues
