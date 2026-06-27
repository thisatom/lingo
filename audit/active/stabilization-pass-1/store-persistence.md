# Audit: Store & persistence

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress  
**Prior:** [`../store-state.md`](../store-state.md)

## Scope

- Chat list, messages, active chat
- Per-chat composer text, attachments map
- Scroll checkpoints, hydration
- Pipeline UI sync per chat
- Delete chat / delete all data

## Key paths

| Layer | Paths |
|-------|--------|
| Entities | `src/entities/chat/model/store.ts`, `message/` |
| Features | `chat/model/useChatRouteSync.ts`, `ai-chat/lib/chat-pipeline-registry.ts` |
| Lib | hydrate / persist modules in entities |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| SP-P1-01 | High | ✅ Fixed | `deleteChat` clears composer attachment blobs + map entry |
| SP-P1-02 | High | ✅ Fixed | Stop on delete uses `getAgentStreamChatId()` only (no stale ref) |
| SP-P1-03 | Medium | 🟡 | Route/hydration — ConversationPanel waits chats hydrate; full gate deferred |
| SP-P1-04 | Medium | ✅ Verified | `replyStatus` on stop covered by integration tests |
| SP-P1-05 | Medium | ✅ Fixed | Virtualized restore via turn estimate + scrollApi `useLayoutEffect` |
| SP-P1-06 | Low | Open | Export/import chats if exists |

## Pass 1 checklist

- [ ] Create chat → messages persist after restart
- [ ] Delete active chat during stream → safe idle
- [ ] Delete other chat while background stream → active unaffected
- [ ] Composer draft per chat survives switch
- [ ] Delete all chats from sidebar

## Pass 2

- Map all Zustand selectors used in hot paths
- Integration test: delete + background stream
