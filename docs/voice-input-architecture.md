# Voice input architecture (Lingo)

This document describes how voice input is designed in Lingo: libraries, modes, state machine, and reliability practices. It is the reference for maintaining or extending speech in the chat UI.

## Goals

| Mode | UX |
|------|-----|
| **Text** | Spoken words appear **live** in the composer input; user edits and presses Send. |
| **Conversation** | A **user message block** fills live while speaking; on end (or Stop) the message is **sent automatically** and the assistant replies with **TTS only in this mode**. |
| **Both** | User can **stop recording at any time** (Stop control or mic toggle). |

## Libraries (existing stack)

| Layer | Library / API | Role |
|-------|----------------|------|
| Live STT (interim + final) | [`react-speech-recognition`](https://www.npmjs.com/package/react-speech-recognition) | Wraps **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`). Delivers `interimTranscript` + `finalTranscript` while the mic is open. |
| Batch STT (fallback) | **OpenRouter Whisper** via `electron/main/stt.ts` + IPC `lingo:stt:transcribe` | Used when Web Speech is unavailable (typical packaged Electron edge cases). Record → encode → transcribe once. |
| Recording (fallback) | `MediaRecorder` (`media-recorder-capture.ts`) | Preferred in Electron; no AudioWorklet/CSP/blob issues. |
| Recording (optional) | WAV + AudioWorklet (`wav-recorder.ts` + `public/audio/*.worklet.js`) | Higher-quality mono PCM for Whisper; second choice after MediaRecorder. |
| TTS (conversation only) | `edge-tts` in main + `playTtsFromBase64` | Assistant reply spoken when `chatComposerMode === 'conversation'`. |
| Chat pipeline | `useAiChat` + `getLingo().chat.stream` | Streaming assistant text; stage in `useConversationStore`. |

**Do not** rely on Web Speech upload in Electron for production-critical paths without a Whisper fallback—Chromium may log `chunked_data_pipe_upload_data_stream` errors when Google STT upload fails.

## Backend selection

```
┌─────────────────────────────────────┐
│ browserSupportsSpeechRecognition()? │
└──────────────┬──────────────────────┘
               │
       yes ────┴──── no
        │              │
        ▼              ▼
  Live path      Whisper path
  (interim → UI) (record → transcribe → UI once)
```

- **Live path**: `useBrowserSpeechVoiceInput` — updates UI on every transcript change.
- **Whisper path**: `useWhisperVoiceInput` — no interim text; updates UI only after `stop()`.

## State machine (voice session)

Phases: `idle` → `starting` → `recording` → (`transcribing` for Whisper only) → `idle`.

Pipeline stages (`useConversationStore.stage`): `listening` while mic open; `transcribing` during Whisper API; then `thinking` / `searching` / `speaking` / `idle` from `useAiChat`.

Important refs:

- `stopRequestedRef` — user released mic or pressed Stop before async `start()` finished; finish or cancel when setup completes.
- `phaseRef` — synchronous guard for `stop()` / `cancel()` (avoids stuck **Listening…**).

## Text mode flow (live)

1. User starts mic → save **draft prefix** (text already in input).
2. On each `transcript` / `interimTranscript` change → `setComposerDraft(prefix + liveText)`.
3. User stops → optional final normalize; prefix cleared.
4. User can edit and Send manually.

Files: `useLiveVoiceInput.ts`, `MainPage.tsx`, `ChatComposer` textarea `value={draft}`.

## Conversation mode flow (live + auto-send)

1. User starts mic → `beginVoiceUserMessage()` adds empty `user` message to active chat.
2. Live transcript → `updateVoiceUserMessage(id, text)` (allow empty content while recording).
3. User stops → `commitVoiceUserMessage(id)` trims, removes empty messages, calls `runAssistantReply`.
4. `useAiChat`: `playTts` only when `chatComposerMode === 'conversation'`.

Files: `useAiChat.ts` (`beginVoiceUserMessage`, `updateVoiceUserMessage`, `commitVoiceUserMessage`, `cancelVoiceUserMessage`), `ConversationPanel` message list.

## Stop anytime

- **Mic toggle** (conversation): tap to start, tap to stop (existing `VoiceRecordButton` `toggle` mode).
- **Stop button**: visible while `voice.isRecording`; calls `voice.stop()` (same as release).
- **Cancel**: switching Text ↔ Conversation while recording calls `voice.cancel()`.

## CSP & Electron notes

- `index.html`: `script-src 'self'`, `worker-src 'self'`, `connect-src` includes Google/OpenRouter hosts for Web Speech and API.
- AudioWorklet must load from `public/audio/*.worklet.js` (not `blob:` URLs).
- Prefer `MediaRecorder` over worklet in Electron.

## Reliability checklist

- [ ] Always clear `listening` / `transcribing` in `hardReset()` when voice session ends.
- [ ] `onVoiceRelease` / Stop use `voice.isBusy`, not only `isRecording` (covers `starting`).
- [ ] Timeouts: MediaRecorder `stop()` 8s; Whisper STT 45s.
- [ ] Empty user voice message removed on cancel or empty commit.
- [ ] `stopAgent()` before new voice message or new send (no overlapping runs).

## File map

```
src/features/voice-input/
  model/useLiveVoiceInput.ts      # Orchestrator (mode + handlers)
  model/useBrowserSpeechVoiceInput.ts
  model/useWhisperVoiceInput.ts
  model/useVoiceInput.ts          # Re-exports useLiveVoiceInput
  lib/record-session.ts

src/features/ai-chat/model/useAiChat.ts   # Voice message lifecycle + TTS gating
src/pages/main/ui/MainPage.tsx           # Wires mode, draft, voice handlers
src/widgets/chat-composer/ui/ChatComposer.tsx  # Mic + Stop
docs/voice-input-architecture.md         # This file
```

## Future improvements

- Streaming Whisper (if OpenRouter adds SSE partials) for live text in Electron without Google STT.
- VAD-based auto-stop (endpointer) in conversation mode.
- Dedicated “voice message” flag on `Message` for styling partial transcripts.
