# Audit: Streaming, Sanitization & Markdown

**Agent:** streaming/sanitization sub-agent  
**Severity scale:** Critical → Low

## Architecture (intended)

```
SSE chunks → extractStreamDelta → rawText accumulator
  → stripAssistantStreamSafeMarkup → text-delta.text → store
  → stripAssistantRoleMarkup at done → persisted content
Store → useStreamMarkdownValue (80ms) → MarkdownContent → render
```

## Critical

### C-1 — Per-chunk full strip in `extractStreamDelta`

| Field | Value |
|-------|-------|
| **Files** | `src/shared/lib/openrouter-model.ts`, `src/shared/lib/openrouter-chat-stream.ts` |
| **Issue** | `extractStreamDelta` calls `extractAssistantText`, which runs `stripAssistantRoleMarkup` on **every SSE chunk** before accumulation. Line-based rules can delete whole chunks; strip is not associative across boundaries. |
| **Fix** | Add unstripped delta extractor; apply `stripAssistantStreamSafeMarkup` on cumulative text for deltas; `stripAssistantRoleMarkup` once at stream end. |

### C-2 — Full strip in `MarkdownContent` during stream

| Field | Value |
|-------|-------|
| **Files** | `src/shared/ui/markdown-content.tsx`, `src/widgets/conversation-panel/ui/ConversationTurn.tsx` |
| **Issue** | While `parseThrottleMs > 0`, UI still runs `stripAssistantRoleMarkup` on partial text — contradicts stream-safe contract. `WEB_SEARCH_RESPONSE_TAIL` can wipe partial buffers. |
| **Fix** | Use `stripAssistantStreamSafeMarkup` when streaming; full strip only when complete. |

## High

### H-1 — Web-search retry resets stream

| **Files** | `openrouter-chat-stream.ts` (`completeWithWebSearch`) |
| **Issue** | Retry starts fresh `rawText` — UI jumps first answer → empty → retry. |
| **Fix** | Merge prefix like `streamCompletionWithIncompleteRetry` or explicit reset event. |

### H-2 — Triple stripping with inconsistent stages

Per-delta full → cumulative stream-safe → UI full → `done` full. Last stream frame can differ from persisted text (flicker at end).

### H-3 — Thinking block uses agent variant

| **Files** | `ThinkingBlock.tsx` |
| **Issue** | Reasoning passed through `stripAssistantRoleMarkup` — planning phrases/tool XML may be stripped. |
| **Fix** | `variant="thinking"` with stream-safe or no leak strip. |

### H-4 — No `openrouter-chat-stream.test.ts`

Stability plan explicitly requires tests; none exist.

## Medium

- **M-1** — `useStreamMarkdownValue` 80ms lag + full re-parse on long answers
- **M-2** — `stripOrphanFencedBlocks` can remove partial fences during stream
- **M-3** — Unclosed code fences change structure when closing delimiter arrives
- **M-4** — Continuation merge may join words without boundary
- **M-5** — Bare URL lines removed from final text (by design, may surprise users)

## Low

- **L-1** — Redundant second strip on completed messages in UI
- **L-2** — `normalizeMarkdown` on user messages may alter pasted formatting
- **L-3** — Misleading `rawText` variable name
- **L-4** — `assistantMessagesSignature` uses length only for non-latest turns

## Regression matrix

| Concern | Status |
|---------|--------|
| Truncated words during stream | **Regressed** (C-1, C-2) |
| Leaked system/tool text | Partially fixed at `done`; may flash in store |
| Markdown parse lag | By design (80ms throttle) |
| User message corruption | **Mitigated** (`variant="user"`) |

## What works

- Stream-safe API documented in `strip-assistant-role-markup.ts`
- Final strip at `fetchCompletionStreaming` return
- `createStreamContentSync` rAF batching
- Unit tests for display-leak patterns and stream-safe syllable chunking
