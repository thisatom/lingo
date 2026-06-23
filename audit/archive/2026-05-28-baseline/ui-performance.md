# Audit: Chat UI, Scroll & Virtualization

**Agent:** UI performance sub-agent

## Executive summary

Scroll-follow during streaming is **mostly intact** via `agentReplyActive`, `buildChatTailScrollSignature`, `ResizeObserver`, and rAF-coalesced stick. Main risks: **virtualizer height cache**, **incomplete tail deps** after removing per-chunk measure, **memo `turnIndex` gap**.

## High

### H-1 — Virtualizer index-based height cache

| **Files** | `VirtualizedConversationTurns.tsx` |
| **Issue** | No `getItemKey`; cached heights by index. After checkpoint edit in 100+ msg chats, wrong `translateY`, overlaps, scroll drift. |
| **Fix** | `getItemKey: (i) => turns[i].id`; remeasure on structural changes. |

### H-2 — Heuristic height estimates

`estimateTurnHeightPx` is char-count only — code blocks, math, attachments, search UI cause drift.

### H-3 — Auto-scroll during active reply (UX)

`shouldStickToBottom` true whenever `agentReplyActive` — user cannot read history during stream without fighting scroll. Pre-existing, amplified by coalesced stick.

## Medium

| ID | Issue | Fix |
|----|-------|-----|
| M-1 | Tail `useEffect` deps miss `stage`, `pipelineStreamingAnswer`, search UI | Extend deps or `tailLayoutSignature` |
| M-2 | Memo skips `turnIndex` → stale sticky z-index after checkpoint delete | Add `turnIndex` to equality |
| M-3 | 100-msg threshold remounts list → scroll jump | Hysteresis or anchor preservation |
| M-4 | Edit mode disables virtualization → jank in long chats | Virtualize with edit row in view |
| M-5 | Single rAF stick vs triple rAF `followBottom` — 1–2 frame gap | Trailing `followBottom` on stage transitions |
| M-6 | Tail signature ignores search/status UI height | Add to signature or explicit deps |

## Low

- L-1: Search sources compared by length only on historical turns
- L-2: Attachment equality length-only
- L-3: `AgentMessage` memo without custom compare (OK today)
- L-4: `overscan: 3` tight for fast scroll
- L-5: `[contain:layout_style]` interaction with virtual rows
- L-6: 80ms markdown throttle — DOM lags store length
- L-7: No unit tests for `areConversationTurnPropsEqual`

## Edge case matrix

| Scenario | Risk |
|----------|------|
| Stream &lt;100 msgs | Low — solid |
| Stream ≥100 msgs | M-1, M-5 |
| Scroll up during stream | H-3 |
| Chat switch during stream | Low (pipeline sync OK) |
| Checkpoint edit ≥100 msgs | H-1, M-2 |
| Enter edit in long chat | M-4 perf spike |
| Thinking → answer transition | M-1 (RO fallback) |

## What looks correct

- `pipelineSearchActiveUrl` lifted to `ConversationPanel` — no cross-chat leakage
- Latest turn always re-renders (memo bypass)
- `followBottom()` on send / edit / agent start
- Per-chat pipeline registry sync
