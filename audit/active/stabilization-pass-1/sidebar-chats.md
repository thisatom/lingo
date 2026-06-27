# Audit: Sidebar, chat list, navigation

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Sidebar chat list, filters, customize menu
- Chat search (Ctrl+K)
- New chat hotkey, route sync
- Delete chat, title generation

## Key paths

| Layer | Paths |
|-------|--------|
| Widgets | `src/widgets/sidebar/` |
| Features | `chat-search/`, `sidebar-customize/`, `chat/model/` |
| Pages | routing in `src/pages/` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| SB-P1-01 | Medium | Open | Chat search filters — edge cases empty query |
| SB-P1-02 | Medium | Open | Delete all chats confirmation + pipeline cleanup |
| SB-P1-03 | Low | Open | Sidebar filter persistence |
| SB-P1-04 | Medium | ✅ Fixed | Sidebar agent dot via `useChatPipeline` + pipeline subscribe |
| SB-P1-06 | Medium | ✅ Fixed | Pin button nested in `SidebarMenuButton` — moved to row-level action |

## Pass 1 checklist

- [ ] Ctrl+K opens search, Esc closes
- [ ] Select chat from search → correct route
- [ ] New chat → empty conversation
- [ ] Delete chat from sidebar menu

## Pass 2

- Keyboard nav through sidebar list
- Mobile/narrow layout if supported
