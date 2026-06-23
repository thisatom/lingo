# Audit: Web Search & Agent Turn Logic

**Agent:** web-search sub-agent

## Flow (UI → API)

```
ChatComposer Globe / AgentSettingsForm
  → useSettingsStore.webSearchEnabled (default: true)
  → runAgentTurn → resolveWebSearchForChatTurn
  → getLingo.chat.stream (desktop IPC / web browser-lingo)
  → streamOpenRouterChat → completeTextChat
  → if request.webSearch && !images → completeWithLocalWebSearch (DDG/MCP)
  → else shouldForceWebSearch → research prompt only
```

## Critical / High

### WS-01 — Toggle ON searches every message (Critical)

| **Files** | `web-search-turn.ts`, `store.ts` (default `webSearchEnabled: true`) |
| **Issue** | Every non-empty text turn triggers DDG search — greetings, small talk, language practice. Tests assert this explicitly. |
| **Fix** | Default off and/or intent gate; toggle = "allow when appropriate" not "always". |

### WS-02 — Force-web-search without toggle does not search (High)

| **Files** | `openrouter-chat-stream.ts`, `web-search-intent.ts` |
| **Issue** | `"search the web for X"` / `"загугли"` sets `researchMode` prompt only — no `completeWithLocalWebSearch`. |
| **Fix** | Run search pipeline when `shouldForceWebSearch(lastUserMessage)` regardless of toggle. |

### WS-03 — Misleading settings copy (High)

AgentSettingsForm: "when needed" — behavior is "every message while enabled".

## Medium

| ID | Issue |
|----|-------|
| WS-04 | Thread-wide attachment block disables search for all later text turns |
| WS-05 | Factual questions no longer auto-search without toggle (intentional capability loss) |
| WS-06 | Custom endpoint: search failure swallowed, silent non-search fallback |
| WS-07 | Search query = raw user message → irrelevant DDG results for casual chat |

## Low

- WS-08: Unused `webSearchRequested` parameter
- WS-09: Stale comment in `local-web-search-progress.ts`
- WS-10: Loose `\bgoogle\b` regex
- WS-11: No tests for search branching in `openrouter-chat-stream.ts`
- WS-12: `completion-quality.ts` tsconfig boundary

## Attachment edge cases

| Scenario | Result |
|----------|--------|
| Text only, toggle on | Search runs ✓ |
| Image attachment | No search ✓ |
| Earlier attachment, later text-only | No search (arguably too aggressive — WS-04) |
| Force search phrase, toggle off | **No real search** ✗ (WS-02) |

## Deleted `local-search-*`

**No broken imports** — grep clean.

## `completion-quality.ts`

Refactor sound; tests pass. No regressions identified.

## Before vs after

| Message | Toggle OFF (old) | Toggle OFF (now) | Toggle ON (now) |
|---------|------------------|------------------|-----------------|
| «как у тебя дела» | Direct reply | Practice prompt | **Full DDG search** |
| «который час» | Local time | Date in system prompt | **Full DDG search** |
| «search the web for X» | Search | **Prompt only** | Full search |
