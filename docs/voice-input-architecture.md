# Voice input architecture (Lingo)

This document describes how voice input is designed in Lingo: libraries, modes, state machine, and reliability practices. It is the reference for maintaining or extending speech in the chat UI.

## Goals

| Mode | UX |
|------|-----|
| **Text** | Spoken words appear **live** in the composer input; user edits and presses Send. |
| **Speech** | Live chat: tap mic once to start a session; after each reply (with TTS) the mic **reopens automatically** until you tap mic again to end. |
| **Text** | Same recording/STT as Speech; message is **sent automatically**; assistant reply has **no TTS**. |
| **Both** | User can **stop recording at any time** (Stop control or mic toggle). |

## End-to-end pipeline (Electron desktop)

Each step runs in the process that fits it — **not** everything in the renderer.

```
Mic (renderer) → MediaRecorder → enhance (EQ/noise gate) → WAV base64
       → IPC lingo:stt:transcribe (main: Whisper small + onnxruntime-node)
       → text in composer / user message
       → IPC lingo:chat:stream (main: OpenRouter)
       → assistant text in UI
       → streaming TTS: each sentence → IPC synthesize → queued playback (renderer)
```

| Step | Process | Why |
|------|---------|-----|
| Record + level meter | Renderer | Needs `getUserMedia` / Web Audio |
| Transcribe | **Main** | No CSP; native ONNX; model cache in `userData/transformers-cache` |
| Chat | **Main** | API keys in keytar |
| TTS | **Main** | `edge-tts-universal` |
| Playback | Renderer | `HTMLAudioElement` + output device from settings |

**Do not** run Transformers.js in the renderer for desktop STT: it pulls WASM from jsDelivr and fights `index.html` CSP (`connect-src`, `script-src`).

## Libraries (existing stack)

| Layer | Library / API | Role |
|-------|----------------|------|
| Live STT (interim + final) | [`react-speech-recognition`](https://www.npmjs.com/package/react-speech-recognition) | Wraps **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`). Delivers `interimTranscript` + `finalTranscript` while the mic is open. |
| Batch STT (desktop) | **Local Whisper small** in `electron/main/local-stt.ts` via IPC | `Xenova/whisper-small` (q8). Audio preprocessed in `enhance-speech-audio.ts` before IPC. |
| Recording (fallback) | `MediaRecorder` (`media-recorder-capture.ts`) | Preferred in Electron; no AudioWorklet/CSP/blob issues. |
| Recording (optional) | WAV + AudioWorklet (`wav-recorder.ts` + `public/audio/*.worklet.js`) | Higher-quality mono PCM for Whisper; second choice after MediaRecorder. |
| TTS (conversation only) | `edge-tts` in main + `playTtsFromBase64` | Assistant reply spoken when `chatComposerMode === 'conversation'`. |
| Chat pipeline | `useAiChat` + `getLingo().chat.stream` | Streaming assistant text; stage in `useConversationStore`. |

**Do not** rely on Web Speech upload in Electron for production-critical paths without a Whisper fallback—Chromium may log `chunked_data_pipe_upload_data_stream` errors when Google STT upload fails.

## Backend selection (`selectSttBackend`)

```
isLingoAvailable() + MediaRecorder?
        │
       yes ──► Local Whisper (Electron desktop — always)
        │
        no
        │
browserSupportsSpeechRecognition()?
        │
       yes ──► Browser (live interim text)
        │
        no ──► unsupported
```

**Why not Web Speech in Electron?** Chromium exposes the API, but uploads to Google often fail (`chunked_data_pipe_upload_data_stream` / error `-2`). The level meter can show signal from the **selected** mic while Web Speech listens on the **system default** → empty transcript and “No speech detected”.

- **Local Whisper path**: same mic stream as the level meter → reliable STT; text appears after you press ✓ (no live typing in Text mode). Model downloads in **main** on first transcribe (~150 MB for `whisper-small`). Renderer runs `enhanceSpeechAudio` (high-pass, noise gate, presence EQ, normalize, trim silence) before IPC.
- **Browser path**: live interim text in the composer / message bubble (web only).

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

## Speech mode — live conversation loop

1. First mic tap → `startLiveConversation()` + record.
2. Second tap (while recording) → stop, transcribe, send, AI reply + TTS.
3. When pipeline returns to `idle` → auto-start recording again (~450 ms pause).
4. Mic tap while idle in live session (not recording) → end live session.
5. Stop agent → ends live session.

Hook: `useLiveConversationLoop.ts`.

## Speech mode flow (live + auto-send)

1. User starts mic → `beginVoiceUserMessage()` adds empty `user` message to active chat.
2. Live transcript → `updateVoiceUserMessage(id, text)` (allow empty content while recording).
3. User stops → `commitVoiceUserMessage(id)` trims, removes empty messages, calls `runAssistantReply`.
4. `useAiChat`: streaming sentence TTS while the model still writes (`streamingSentenceTts`), only in `conversation` mode.

Files: `useAiChat.ts` (`beginVoiceUserMessage`, `updateVoiceUserMessage`, `commitVoiceUserMessage`, `cancelVoiceUserMessage`), `ConversationPanel` message list.

## Stop anytime

- **Mic toggle** (conversation): tap to start, tap to stop (existing `VoiceRecordButton` `toggle` mode).
- **Stop button**: visible while `voice.isRecording`; calls `voice.stop()` (same as release).
- **Cancel**: switching Text ↔ Conversation while recording calls `voice.cancel()`.

## CSP & Electron notes

- `index.html` CSP applies only to the **renderer**. OpenRouter + Google hosts for chat/Web Speech. Hugging Face / jsDelivr are **not** required — STT and model downloads happen in main.
- `electron.vite.config.ts`: `@huggingface/transformers` and `onnxruntime-node` are **external** in the main bundle (dynamic `import()` at first transcribe).
- AudioWorklet must load from `public/audio/*.worklet.js` (not `blob:` URLs).
- Prefer `MediaRecorder` over worklet in Electron.

## Reliability checklist

- [ ] Always clear `listening` / `transcribing` in `hardReset()` when voice session ends.
- [ ] `onVoiceRelease` / Stop use `voice.isBusy`, not only `isRecording` (covers `starting`).
- [ ] Timeouts: MediaRecorder `stop()` 8s; Whisper STT 45s.
- [ ] Empty user voice message removed on cancel or empty commit.
- [ ] `stopAgent()` before new voice message or new send (no overlapping runs).

## Live level meter

`useAudioLevelMonitor` + `MicLevelVisualizer` show whether PCM reaches the app (Web Audio `AnalyserNode`). Used in:

- Chat: `VoiceCaptureBar` while recording (Settings → **Devices** mic must match).
- Settings → **Devices** → Microphone test.

If bars stay flat: wrong input device, OS mute, or another app holding the mic exclusively.

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
src/features/speech-to-text/lib/enhance-speech-audio.ts  # Pre-STT DSP
src/features/speech-to-text/lib/ensure-wav-for-stt.ts    # Decode + enhance + WAV
electron/main/local-stt.ts               # Whisper (main, lazy load)
electron/main/stt.ts                     # IPC handler
docs/voice-input-architecture.md         # This file
```

## Future improvements

- Streaming Whisper (if OpenRouter adds SSE partials) for live text in Electron without Google STT.
- VAD-based auto-stop (endpointer) in conversation mode.
- Dedicated “voice message” flag on `Message` for styling partial transcripts.
