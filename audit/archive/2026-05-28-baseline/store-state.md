# Audit: Chat Store & State Sync

**Agent:** store/state sub-agent  
**Cross-check:** `docs/CHAT_AGENT.md`, `docs/CHAT_AGENT_STABILITY_PLAN.md`

## Executive summary

Per-chat pipeline + `ChatAgentController` refactor is structurally sound. **Critical:** chat switch with `force: true` aborts background streams — contradicts QA D1/D3 and `BackgroundStreamHint`.

## P0 — Critical

### P0-1 — Chat switch aborts background streams

| **Files** | `useAiChat.ts` (L155–161), `chat-agent-stop.ts`, `BackgroundStreamHint.tsx` |
| **Issue** | On `activeChatId` change: `stop({ chatId: previous, force: true })` always aborts global stream. Switching A→B while A streams kills A. |
| **Contract** | QA D1: A streams → B not busy from A. D3: return to A after completion. |
| **Fix** | Remove blanket `force: true` on navigation; only abort when intentional or same stream owner. |

```typescript
// useAiChat.ts — problematic pattern
useEffect(() => {
  const previous = prevActiveChatIdRef.current
  if (previous && previous !== activeChatId) {
    chatAgentController.stop({ chatId: previous, force: true }, buildStopContext())
  }
  prevActiveChatIdRef.current = activeChatId
}, [activeChatId, buildStopContext])
```

## P1 — High

### P1-2 — Stale pipeline on delete stops wrong stream

`stopAgentOnChatDeleted`: `pipelineBusy` on deleted idle chat while another chat streams → `force: true` aborts live stream.

**Fix:** Force-stop only when `streamChatId === chatId` or pending reply.

### P1-3 — `deleteChat` leaks composer attachments

Clears draft and scroll but not `composerAttachmentsByChatId[id]`.

## P2 — Medium

| ID | Issue |
|----|-------|
| P2-4 | Orphan tail prune misses partial assistant after stop |
| P2-5 | `stream-content-sync` cancel drops pending RAF text on abrupt end |
| P2-6 | Duplicate `syncPipelineUiForActiveChat` on chat switch |
| P2-7 | `registerChatDeletedHandler` single slot only |

## P3 — Low

- No automated test for chat-switch + background stream
- `ensureActiveChat` vs `createChat` pending-composer asymmetry
- Settings screen + agent busy (documented in manual QA F1)

## Area assessment

| Area | Status |
|------|--------|
| Message CRUD / tail removal | OK |
| `deleteChat` | Partial (attachments) |
| Pending composer | OK |
| Orphan tail prune | Partial (empty only) |
| `run-agent-turn` cross-chat guard | OK |
| Per-chat pipeline sync | OK |
| Background stream on switch | **Broken** |

## Docs alignment

| Requirement | Match? |
|-------------|--------|
| Stop clears queue + pending | Yes |
| Background stream / two chats | **No** — switch aborts |
| Orphan thinking cleanup | Partial |
| Phase 4 integration tests | Incomplete |
| Controller extraction | In progress |

## Test coverage

| Present | Gap |
|---------|-----|
| `pending-composer.test.ts` | — |
| `chat-agent-stop.test.ts` | — |
| `stop-agent-on-chat-delete.test.ts` | Stale-pipeline cross-chat |
| `chat-pipeline-registry.test.ts` | — |
| `run-agent-turn.integration.test.ts` | No switch/delete races |
| **Chat switch + stream** | **None — P0 undetected** |
