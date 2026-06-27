# Audit: Message translate

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Translate assistant/user message action
- Target language from settings
- API call path, errors, loading state
- Does not break message markdown

## Key paths

| Layer | Paths |
|-------|--------|
| Feature | `src/features/message-translate/` (`use-reply-translation.ts`, `translate-markdown.ts`, `ReplyTranslateMenu.tsx`) |
| UI | `AgentMessageActions.tsx`, `AgentMessage.tsx` |
| IPC | `translate` in `src/shared/types/ipc.ts`, `translateTextRequestSchema` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| MT-P1-01 | Medium | Open | Translate during agent busy |
| MT-P1-02 | Medium | Open | Long message chunking / truncation |
| MT-P1-03 | Low | Open | Copy translated vs original |
| MT-P1-04 | Low | Open | Rate limit / key errors |

## Pass 1 checklist

- [ ] Translate EN → RU on assistant message
- [ ] UI shows loading, then result or error
- [ ] Regenerate does not orphan translation UI

## Pass 2

- Locate implementation files and fill Key paths table
- Add to manual QA if missing
