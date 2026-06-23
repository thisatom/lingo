# UI/UX — Cursor & Pointer Affordances

**Status:** Sprint 1 ✅ · Sprint 2 ✅

---

## Root cause

Tailwind preflight in `globals.css` sets `font: inherit` on `button` but **not** `cursor: pointer`. Any raw `<button>` or custom interactive surface without explicit class shows the default arrow.

---

## Fixed

### Global baseline (`globals.css`)

```css
button:not(:disabled),
[role='button']:not([aria-disabled='true']) {
  cursor: pointer;
}
```

### Shared primitives

| Component | Change |
|-----------|--------|
| `dropdown-menu.tsx` | Item / sub-trigger: `cursor-pointer` |
| `context-menu.tsx` | Item: `cursor-pointer` |
| `select.tsx` | Item + scroll buttons: `cursor-pointer` |
| `checkbox.tsx` | Enabled: `cursor-pointer` |
| `label.tsx` | `cursor-pointer` (+ peer-disabled not-allowed) |
| `resizable.tsx` | Handle: `cursor-col-resize` |
| `slider.tsx` | Thumb: `cursor-grab active:cursor-grabbing` |
| `custom-scroll-area.tsx` | Thumb: grab cursors |
| `typography.tsx` | Link token: `cursor-pointer` |

### Spot fixes

| File | Element |
|------|---------|
| `BackgroundStreamHint.tsx` | Open chat |
| `MainPage.tsx` | Speech error Dismiss |
| `ChatMessageQueue.tsx` | Start Multitasking toggle |
| `ChatHeaderTitle.tsx` | Hover card trigger (`cursor-pointer`) |
| `UserQuestionContextMenu.tsx` | `cursor-not-allowed` when `activateDisabled` |
| `link-preview-hover.tsx` | Explicit pointer on anchors |

---

## Already OK (verified)

- `Button` / `TooltipIconButton` — `cursor-pointer`
- Composer pickers — trigger classes include pointer
- Sidebar menu buttons, settings nav items
- App call sites passing `sidebarMenuItemClass` / `settingsSelectItemClass`

---

## Deferred / low

| Item | Notes |
|------|-------|
| `button.tsx` disabled | `pointer-events-none` hides `cursor-not-allowed` — acceptable |
| GFM task-list checkboxes | Read-only; optional `pointer-events-none` |
| `ComposerAgentMenuSelect` disabled row | Uses `cursor-default` override |
| Queue `<li>` row hover | Non-clickable row hover — cosmetic |

---

## QA

- [ ] Every visible button/link shows hand cursor on hover
- [ ] Disabled controls show not-allowed where applicable
- [ ] Sidebar resize handle shows col-resize
- [ ] Slider / chat scrollbar thumb shows grab
