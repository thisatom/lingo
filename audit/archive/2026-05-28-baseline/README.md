# Chat Audit — baseline (archived)

**Date:** 2026-05-28  
**Commit:** `62a1287` — Fix streaming truncation, remove search heuristics, smooth chat rendering  
**Method:** 4 parallel read-only sub-agent audits + consolidation

> **Archived.** Исходные findings до серии фиксов. Актуальный статус — [`../../active/SUMMARY.md`](../../active/SUMMARY.md).

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
