# UI/UX — Click Propagation & Double-Click

**Status:** High/medium ✅ · refinements accepted (see SUMMARY)

---

## Pattern map

```
First click ignored
├── Invisible hit target (opacity-0, still pointer-events-auto)
├── Full-width overlay captures click (pointer-events-auto on wrapper)
├── Blur-before-click (textarea onBlur then button click)
├── Nested handlers (bubble onClick + child action)
└── pointerdown-only button (VoiceRecordButton toggle)
```

---

## Fixed (Sprint 1)

### UX-C1 — MainPage bottom overlay (High)

**File:** `src/pages/main/ui/MainPage.tsx`

Transparent full-width bottom wrapper used `pointer-events-auto`, blocking clicks on conversation content above the composer column.

**Fix:** Wrapper `pointer-events-none`; inner stack `pointer-events-auto`.

### UX-C2 — Sidebar pin (High)

**File:** `ChatSidebarIndicator.tsx`

Pin `TooltipIconButton` covered left 24px at `opacity-0` with `pointer-events-auto` — first click toggled pin instead of opening chat.

**Fix:** `pointer-events-none` by default; `group-hover/chat:pointer-events-auto`, focus-visible, and when pinned.

### UX-C3 — Sidebar delete (High)

**File:** `ChatListItem.tsx`

Delete icon invisible but clickable in `pr-8` zone.

**Fix:** Same pointer-events pattern as pin.

### UX-C4 — Queue edit blur (Medium)

**File:** `ChatMessageQueue.tsx`

`onBlur` on edit textarea committed before action button received click.

**Fix:** `onMouseDown={(e) => e.preventDefault()}` on row action buttons; hidden actions `pointer-events-none`.

### UX-C12 — Link in user bubble (Medium)

**File:** `link-preview-hover.tsx`

Link click bubbled to parent `onActivate` (edit).

**Fix:** `onClick={(e) => e.stopPropagation()}` on markdown anchors.

---

## Deferred

| ID | File | Issue | Suggestion |
|----|------|-------|------------|
| UX-L9 | `VoiceRecordButton.tsx` | Toggle only on `pointerdown` | Add `onClick` fallback |
| UX-L10 | `UserMessage.tsx` | Whole bubble + action button overlap | Edit only via action icon |
| — | `ConversationPanel.tsx` | Edit dismiss on document pointerdown | Exclude composer explicitly |
| — | `SidebarFilterMenu.tsx` | Tooltip + Dropdown nesting | Tooltip on openChange only |
| — | Checkpoint confirm | Two-step “return to point” | Label/hint UX |

---

## Verified OK

- `MessageBodyClamp` fade: `pointer-events-none`
- `ChatEmptyPrompt` overlay: `pointer-events-none`
- Virtualized rows: no duplicate row click handlers
- Markdown code copy: intentional `stopPropagation`

---

## QA

- [ ] Bottom third of chat: single click on message body
- [ ] Sidebar row: click title opens chat on first try
- [ ] Queue edit: Send now / Remove on first click
- [ ] User message link: navigates without entering edit
