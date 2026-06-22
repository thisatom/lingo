# Lingo Chat Audit

**Date:** 2026-05-28  
**Commit:** `62a1287` — Fix streaming truncation, remove search heuristics, smooth chat rendering  
**Method:** 4 parallel read-only sub-agent audits + consolidation

## Scope

Global regression review of the chat subsystem after recent changes:

- Stream-safe markup vs full strip at end
- Removal of `local-search-*` intent heuristics
- rAF-throttled markdown, memoized turns, coalesced scroll
- Per-chat pipeline state sync

## Reports

| Report | Focus |
|--------|--------|
| [SUMMARY.md](./SUMMARY.md) | Consolidated findings, priority fix order |
| [streaming-sanitization.md](./streaming-sanitization.md) | SSE pipeline, markdown, leak stripping |
| [web-search-agent.md](./web-search-agent.md) | Web search toggle, force-search, attachments |
| [ui-performance.md](./ui-performance.md) | Scroll, virtualization, React memo |
| [store-state.md](./store-state.md) | Store, pipeline sync, delete/switch edge cases |

## Severity Legend

| Level | Meaning |
|-------|---------|
| **Critical** | Data loss, wrong answers, broken core flow |
| **High** | Major UX regression or contract violation |
| **Medium** | Noticeable edge-case bugs or perf issues |
| **Low** | Minor polish, test gaps, stale comments |

## Sub-agents

Audits were produced by dedicated explore sub-agents (streaming, web search, UI perf, store/state).
