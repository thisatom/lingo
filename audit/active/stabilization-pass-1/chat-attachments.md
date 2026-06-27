# Audit: Chat attachments

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Composer file picker, paste, drag-drop
- Image preview, Monaco text preview
- Queued attachments with pending messages
- Agent vision / web search interaction

## Key paths

| Layer | Paths |
|-------|--------|
| Features | `src/features/chat-attachments/` |
| UI | `AttachmentListPanel.tsx`, `QueuedMessageAttachments.tsx`, `ComposerFileInput.tsx` |
| Lib | `collect-files.ts`, `merge-composer-attachments.ts`, `resolve-dropped-files` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| AT-P1-01 | High | Open | Attachments map on `deleteChat` (store link) |
| AT-P1-02 | Medium | Open | Large file size limits / error copy |
| AT-P1-03 | Medium | Open | Paste image from clipboard |
| AT-P1-04 | Medium | Deferred | Vision + force-search (WS-15) |
| AT-P1-05 | Low | Open | Preview dialog theme (monaco) |
| AT-P1-06 | Medium | Open | Drop from OS file manager paths (sync extract) |

## Pass 1 checklist

- [ ] Attach image → thumbnail in composer
- [ ] Send with message → visible in user turn
- [ ] Remove attachment before send
- [ ] Queue multiple messages with different attachments

## Pass 2

- Security: path traversal on dropped paths (desktop)
- Memory: large images in memory
