# UI/UX Audit — Executive Summary

**Date:** 2026-06-23  
**Status:** ✅ **Closed** (Sprints 1–2)  
**Tests:** 297+ passing  
**Archive:** [`../archive/2026-06-23-ui-ux-closure/`](../archive/2026-06-23-ui-ux-closure/)

---

## Reports

| Report | Focus |
|--------|--------|
| [cursor-interaction.md](./cursor-interaction.md) | Missing `cursor-pointer`, grab/resize cursors |
| [click-propagation.md](./click-propagation.md) | Double-click, invisible hit targets, overlays |
| [layout-visual.md](./layout-visual.md) | Scroll inset, virtualizer jumps, z-index, motion |

---

## Sprint 1 — fixed

| ID | Area | Fix |
|----|------|-----|
| UX-C1–C13 | Cursors, clicks, polish | See prior sprint table in archive |

---

## Sprint 2 — fixed (2026-06-23)

| ID | Area | Fix |
|----|------|-----|
| UX-L1 | Dynamic bottom inset | `bindChatBottomInset` + `--lingo-chat-bottom-inset` CSS var |
| UX-L2 | Virtualizer estimates | Higher code/math/image heuristics |
| UX-L3 | Streaming segment remount | Stable keys (`type:index`) while streaming |
| UX-L4 | Composer vs popovers | Popover/dropdown content `z-[60]` |
| UX-L5 | Sticky user headers | Disabled by default (`userHeaderSticky=false`) |
| UX-L6 | Message clamp | “Show more” expander on overflow |
| UX-L7 | Scroll-to-latest shift | Reserved slot with opacity toggle |
| UX-L8 | Narrow viewport | Auto-collapse sidebar when `useIsMobile` |
| UX-L9 | VoiceRecordButton | `onClick` fallback in toggle mode |
| UX-L10 | User bubble edit | Edit only via action button; context menu copy-only |
| UX-L11 | Queue row hover | Removed in Sprint 1 |

**Also:** edit dismiss excludes `[data-composer-root]`; `ChatComposer` marked with attribute.

---

## Accepted / no code change

| Item | Reason |
|------|--------|
| Stream cursor horizontal jitter | Cosmetic; low impact |
| User/agent same bubble token | Product choice |
| Titlebar theme 1px seam | Electron edge case |
| Startup skeleton width | Brief flash only |
| SidebarFilterMenu tooltip nesting | Low repro rate |
| Checkpoint two-step confirm | Intentional safety UX |

---

## Manual QA — mapped

| Check | Coverage |
|-------|----------|
| Bottom inset with queue/voice | ResizeObserver + CSS var |
| Virtualizer code reply | Improved `estimateTurnHeightPx` |
| Sources popover above composer | z-[60] |
| Mobile sidebar | AppLayout collapse |
| Edit + composer click | `data-composer-root` guard |
| Show more on long user text | MessageBodyClamp |

One desktop smoke pass still recommended before release.

---

## Method

Three parallel codebase explorations + Sprint 1–2 implementation.
