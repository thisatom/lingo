# Chat Agent Rework Plan

**Status:** ✅ Sprint D done — agent rework complete

Goal: agent understands user intent, language-practice toggle is real, web search returns fresh useful answers, streamed text has no broken `</u…>` leaks — without regressing the existing IPC/stream contract.

## Library choice

**Vercel AI SDK** (`ai`, `@ai-sdk/openai`) — already in `package.json`, free, OpenRouter-compatible via custom `baseURL`. LangGraph deferred (project rule: linear chat MVP).

## Architecture (target)

```
User message
  → resolveAgentTurnPolicy()     # intent, web search, prompt mode
  → performWebSearch()           # local → OpenRouter plugin fallback
  → streamAgentCompletion()      # AI SDK streamText (default) or legacy SSE (custom / Vitest)
  → strip stream-safe markup
  → store + UI
```

## Sprints

| Sprint | Scope | Status |
|--------|--------|--------|
| **A** | Turn policy module, prompt fixes, language practice in main sanitize, HTML leak strip, fresher search prompts | ✅ |
| **B** | AI SDK `streamText` adapter emitting existing `ChatStreamEvent`s; wire into `openrouter-chat-stream` behind flag | ✅ |
| **C** | AI SDK tools: `web_search` tool wrapper; optional `classify_intent` structured output | ✅ |
| **D** | Retire duplicate SSE parser when adapter parity proven; docs + manual QA | ✅ |

## Sprint A deliverables

- [x] `shared/lib/lingo-agent/turn-policy.ts` — single source for prompt mode + web search gate
- [x] Research/general prompts respect `languagePractice === false`
- [x] `languagePracticeEnabled` in Electron persisted snapshot + sanitize fallback
- [x] Stream-safe strip for HTML underline/formatting tags + partial tag tail
- [x] Web research block instructs model to prefer excerpts over stale training data
- [x] Tests green (`npm test`)

## Sprint B deliverables

- [x] `streamChatCompletionViaAiSdk` — maps AI SDK stream → `thinking-delta` / `text-delta`
- [x] Wired into `fetchCompletionStreaming` when `isAiSdkStreamEnabled()` (on in app, legacy in Vitest)
- [x] OpenRouter plugins / `max_tokens` merged via fetch middleware
- [x] Custom LLM stays on legacy SSE path
- [x] Env: `LINGO_AI_SDK_STREAM=0|1`, `VITE_LINGO_AI_SDK_STREAM=0|1`

## Sprint B notes

- Map `thinking-delta` from AI SDK reasoning parts where model supports it
- Keep `performLocalWebSearch` as tool implementation
- Feature flag: `LINGO_AI_SDK_STREAM=1` or settings toggle later

## Regression guard

Always run:

```bash
npm test -- src/shared/lib/openrouter-chat-stream.test.ts \
           src/shared/lib/web-search-turn.test.ts \
           src/shared/lib/strip-assistant-role-markup.test.ts \
           src/features/ai-chat
```

Manual: [CHAT_AGENT_MANUAL_QA.md](../../docs/CHAT_AGENT_MANUAL_QA.md)

## Sprint C deliverables

- [x] `web-search-tool.ts` — AI SDK `web_search` tool wrapping `performLocalWebSearch`
- [x] `intent-classifier.ts` — heuristic structured intent (no extra LLM call; `generateObject` deferred)
- [x] `openrouter-ai-sdk.ts` — tools / `toolChoice` / multi-step `stopWhen`
- [x] AI SDK local web-search path uses tool loop when `isAiSdkStreamEnabled()` (legacy SSE unchanged in Vitest)
- [x] Tests green

## Sprint D deliverables

- [x] Legacy SSE parser extracted to `legacy-sse-stream.ts` (AI SDK default in app; legacy for custom LLM + Vitest)
- [x] Unit tests for legacy SSE parser
- [x] `docs/CHAT_AGENT.md` — lingo-agent modules, AI SDK vs legacy paths, language practice, markup strip
- [x] `docs/CHAT_AGENT_MANUAL_QA.md` — sections G (language practice), H (web search), I (stream quality)

## Open items (deferred)

- Full LangGraph multi-step agents
- Vision + force-search interaction (WS-15)
- Separate intent LLM call on every message (`generateObject` classifier)
