# Audit: Streaming & sanitization

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress (stream-safe safety/kernel leaks, 2026-06-27)  
**Prior:** [`../streaming-sanitization.md`](../streaming-sanitization.md)

## Scope

- SSE delta extraction, stream-safe vs final strip
- Assistant role markup leaks in UI
- Display leaks: `User Safety: safe undefined`, garbled kernel constants
- Markdown live parse during stream

## Key paths

| Layer | Paths |
|-------|--------|
| Lib | `src/shared/lib/strip-assistant-display-leaks.ts`, `openrouter-chat-stream.ts` |
| UI | `MarkdownContent`, `markdown-code-block.tsx` |
| Tests | `strip-assistant-display-leaks.test.ts`, `openrouter-chat-stream.test.ts` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| SS-P1-01 | High | ✅ Fixed | `USER_SAFETY_UNDEFINED_TAIL` sanitizer |
| SS-P1-02 | Medium | ✅ Fixed | `IRPMJ_COLLAPSED` → `IRP_MJ_READ` normalization |
| SS-P1-03 | Critical | ✅ Verified | Stream path uses `stripAssistantStreamSafeMarkup` only (no full citation strip) |
| SS-P1-04 | Critical | ✅ Verified | `MarkdownContent` applies stream-safe vs final strip by `parseThrottleMs` |
| SS-P1-05 | Medium | ✅ Fixed | Retroactive `stripAssistantRoleMarkup` on chat rehydrate + persist v6 migrate |
| SS-P1-06 | Medium | ✅ Verified | Monotonic text-delta test; merge in `openrouter-chat-stream.test.ts` |

## Pass 1 checklist

- [ ] Stream long code answer → no word truncation mid-token
- [ ] Reasoning tags not shown in assistant bubble
- [ ] Final `done` applies full strip once
- [ ] User messages never stripped

## Pass 2

- Audit every `stripAssistant*` call site
- Add regression fixtures for leak strings
