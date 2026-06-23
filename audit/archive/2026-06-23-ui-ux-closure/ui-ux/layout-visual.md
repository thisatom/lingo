# UI/UX — Layout, Jank & Visual Polish

**Status:** Partial — Sprint 1 quick wins; structural items deferred

Prior chat-performance audit (`ui-performance.md`) closed scroll/virtualization basics. This report covers **remaining** UX gaps.

---

## Fixed (Sprint 1)

| ID | Issue | Fix |
|----|-------|-----|
| UX-C9 | Settings used `CustomScrollArea variant="chat"` → wrong bottom fade | `variant="sidebar"` |
| UX-C10 | `ShinyText` ignores Reduce UI motion | `disabled` prop + plain fallback; wired in AgentStatus / ThinkingBlock |
| UX-C11 | Delete dialog `#d4d4d4` on light theme | Semantic foreground token |

---

## Fixed (Sprint 2)

| ID | Issue | Fix |
|----|-------|-----|
| UX-L1 | Fixed bottom inset | `sync-chat-bottom-inset.ts` → CSS variable |
| UX-L2 | Virtualizer underestimate | Code/math/image heuristics in `estimate-turn-height.ts` |
| UX-L3 | Streaming remount steps | Stable segment keys while `streamingParse` |
| UX-L4 | Popover under composer | `z-[60]` on popover/dropdown content |
| UX-L5 | Sticky header stacking | `userHeaderSticky={false}` default |
| UX-L6 | User clamp | “Show more” in `MessageBodyClamp` |
| UX-L7 | ScrollToLatest shift | Always mounted, opacity toggle |
| UX-L8 | Narrow viewport | Auto-collapse sidebar on mobile |

---

## Accepted / backlog (no code)

| ID | Issue | File(s) |
|----|-------|---------|
| UX-L9 | Stream cursor jitter | Low — accepted |
| UX-L10 | User/agent bubble color | Product choice |
| — | User edit mode layout shift | Partially improved via clamp expand |
| — | Composer textarea resize | Covered by UX-L1 dynamic inset |
| — | ChatEmptyPrompt GSAP | Optional future: wire reduceUiMotion to TextType |

---

## Low — backlog

- Thinking text contrast (dark theme token)
- User/agent same bubble color (weak role separation)
- Titlebar theme transition 1px seam
- Startup skeleton vs resizable sidebar width
- Agent picker overflow on narrow toolbar

---

## QA scenarios

1. Stack queue + voice bar + attachments — last message fully visible
2. 100+ messages, stream code block while scrolled mid-history — no jump
3. Settings — no gradient at bottom of scroll
4. Reduce UI motion ON — no shiny thinking/search text
5. Sources popover on last message — not behind composer
6. ~600px width — toolbar overflow check
