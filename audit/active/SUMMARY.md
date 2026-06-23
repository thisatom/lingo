# Chat Audit — Executive Summary

**Date:** 2026-06-23  
**Status:** ✅ **Fully closed** (sprints A–F)  
**Tests:** 295+ passing  
**Archive:** [`../archive/2026-06-23-global-audit-closure/`](../archive/2026-06-23-global-audit-closure/)

---

## Sprint F — final deferred items (2026-06-23)

| ID | Fix |
|----|-----|
| S-6 | Credit-error streaming retry merges prior `text-delta` prefix |
| S-10 | Skip `normalizeMarkdown` while streaming (`streamingParse`) |
| UI-10 | Stable React keys for markdown segments |
| WS-16 | Local web search validates substantive answer before `done` |
| ST-7 | Documented IPC abort / `stream.done` contract |
| ST-8 | TTS keeps playing when switching away from a background-stream chat |
| WS-31 | Composer tooltip mentions force-search phrase |

**Accepted / no code change:** S-5 (stream leak flash by design), S-7 (strip at `done` is idempotent), S-9 (no duplicate `done` in retry wrappers), WS-15 (attachments block search via WS-14), WS-28–30 (docs/native path).

---

## Manual QA — mapped to automation

| Check | Coverage |
|-------|----------|
| Stop mid-stream | `run-agent-turn.integration.test.ts` |
| 100+ edit scroll | Sprint C + `turn-content-signature` |
| Search cache freshness | `web-search-messages.test.ts` |
| Attachment + force-search | `web-search-turn.test.ts`, `openrouter-chat-stream.test.ts` |
| Custom LLM search fallback | `openrouter-chat-stream.test.ts` |
| Abort during search | `local-web-search-abort.test.ts` |
| Chat switch speech/queue | `chat-pipeline-registry.test.ts` |

One desktop smoke pass still recommended before release.

---

## Report index (archived copy)

See [`../archive/2026-06-23-global-audit-closure/`](../archive/2026-06-23-global-audit-closure/) for full sprint history and topic reports.
