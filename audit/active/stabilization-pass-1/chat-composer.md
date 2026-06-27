# Audit: Chat composer

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress

## Scope

- Text input, send, stop, speech mode toggle
- Message queue while agent busy
- Attachments trigger, paste
- Hotkeys (new chat, mode)

## Key paths

| Layer | Paths |
|-------|--------|
| Widget | `src/widgets/chat-composer/ui/ChatComposer.tsx` |
| Features | `chat-composer/`, `chat-attachments/` (composer hooks) |
| Agent | queue integration in `useAiChat` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| CC-P1-01 | Medium | ✅ Fixed | Mic + send when text during busy |
| CC-P1-02 | High | ✅ Fixed | Stop uses scoped `stopAgent` — queue preserved; force only for hard reset |
| CC-P1-03 | Medium | ✅ Verified | FIFO queue drain — `chat-agent-controller.test.ts` |
| CC-P1-04 | Medium | ✅ Verified | Inline edit prefills draft + attachments in `UserMessage` (by design, not composer) |
| CC-P1-05 | Low | ✅ Fixed | Mode-specific composer placeholder via `resolveComposerPlaceholder` |
| CC-P1-06 | Medium | ✅ Fixed | `actionsDisabled` includes `!llmChatReady`; regen/continue gated; no refresh flicker |

## Pass 1 checklist

- [ ] Enter send, Shift+Enter newline
- [ ] Stop visible only when agent busy
- [ ] Queue badge / hint if implemented
- [ ] Attachment button + drag-drop zone
- [ ] Composer height growth / max rows

## Pass 2

- Trace submit → queue → `runAgentTurn` for 3 rapid sends
