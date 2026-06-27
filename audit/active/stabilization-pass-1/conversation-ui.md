# Audit: Conversation UI (panel, scroll, message rows)

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress (Sprint 4, 2026-06-27)  
**Prior UI:** [`../ui-ux/`](../ui-ux/)

## Scope

- Conversation panel, virtualizer, tail stick
- Auto-scroll smart follow (pause on user scroll up)
- Nested scroll in code blocks / tables
- Agent message actions, Continue button layout
- Thinking vs assistant blocks

## Key paths

| Layer | Paths |
|-------|--------|
| Widgets | `src/widgets/conversation-panel/` |
| Entities UI | `AgentMessage.tsx`, `ConversationTurn.tsx` |
| Shared | `src/shared/lib/chat-nested-scroll.ts`, markdown components |
| Features | `ai-chat/ui/AgentMessageActions.tsx` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| CU-P1-01 | High | ✅ Fixed | Nested code scroll no longer pauses chat follow wrongly |
| CU-P1-02 | Medium | ✅ Fixed | Sticky headers on code blocks |
| CU-P1-03 | Medium | ✅ Fixed | Continue **in** action bar (Copy/Speak row), not outside — Sprint 0 |
| CU-P1-04 | High | ✅ Fixed | Virtualizer `getItemKey` by turn id + remeasure on content/replyStatus |
| CU-P1-05 | Medium | ✅ Fixed | 100+ messages: virtualizer wired via `resolveVirtualizedTurnsActive` |
| CU-P1-06 | Medium | ✅ Fixed | Reply actions hidden for entire active turn; flat agent layout preserved |
| CU-P1-07 | High | ✅ Fixed | Checkpoint confirm on enter-edit restored (`pendingCheckpointMessageId`) |

## Pass 1 checklist

- [ ] Long stream → scroll follows until user scrolls up — [manual QA matrix](./conversation-ui-manual-qa.md)
- [ ] Wheel up → pause follow; scroll to bottom → resume — manual QA
- [x] Horizontal scroll inside `<pre>` does not pause chat — `chat-nested-scroll.test.ts`
- [ ] Regenerate at tail → layout stable — manual QA
- [ ] Empty chat / welcome state — manual QA

## Pass 2 (Sprint 4)

- [x] Virtualizer remeasure on structural edits (`turn-content-signature` includes `replyStatus`)
- [x] Tail scroll signature includes pipeline stage, search URL, reply actions readiness
- [x] `ConversationPanel` switches to `VirtualizedConversationTurns` at 100+ messages (hysteresis 90/100)
- [x] Flat ↔ virtualized scroll anchor restore (`captureVirtualizationScrollAnchor`)
- [ ] Perf: memo boundaries on non-tail rows — existing `areConversationTurnPropsEqual`
- [ ] Full manual matrix on desktop (100+ msg chat, checkpoint edit, stream + scroll up)
