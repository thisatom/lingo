# STT audit: crashes & stability

## Symptoms

User report: app **crashes during speech recognition** (main process exit or blank UI after mic stop).

## Root causes (code review)

### 1. Race on model load + transcribe

`getTranscriber()` lazy-loads `@huggingface/transformers` on first IPC call. If the user stops recording while the model is still downloading, a second transcribe could start parallel inference before the pipeline is ready.

**Fix:** `enqueueStt()` serializes all transcribe jobs in `electron/main/local-stt.ts`.

### 2. Sample rate mismatch → throw in main

`decodeWavPcm16ToFloat32` threw `UNSUPPORTED_SAMPLE_RATE` when WAV header rate ≠ 16 kHz. MediaRecorder fallback path resamples in renderer, but any WAV at 44.1/48 kHz hit main decode and failed hard.

**Fix:** Default resample to 16 kHz via `resampleMono()` in `wav-pcm.ts`.

### 3. Large / invalid payloads

- IPC schema allows up to 25 MB base64; 120 s mono 16 kHz ≈ 3.8 MB — safe.
- Added `MAX_AUDIO_SAMPLES` guard to reject oversize float buffers before inference.

### 4. Error propagation

IPC handler now `async` with explicit log on failure. Renderer `useWhisperVoiceInput` maps `STT_MODEL_LOAD_FAILED`, `RECORDING_TOO_LONG`.

### 6. Linux: ONNX in Electron main process

Whisper inference via `onnxruntime-node` inside the Chromium main process can **SIGKILL/SIGSEGV** the whole app (no JS stack trace — log stops at `Transcribe N samples`). Reproduced path: ~20 s clip, model loaded, crash mid-`pipe()`.

**Fix:** run STT in a **forked child** (`ELECTRON_RUN_AS_NODE=1` + `stt-worker.js`). Main survives worker crash; host respawns on next request. Long audio (>15 s) is transcribed in overlapping chunks to cap ONNX RAM.

**Also:** `electron-rebuild` for `onnxruntime-node`; DevTools auto-open disabled unless `LINGO_DEVTOOLS=1` (saves RAM in dev).

First Whisper download (~150 MB) blocks `getTranscriber()`. Without warm load, stopping mic during download felt like a hang/crash.

**Fix:** `warmLocalStt()` called from `electron/main/index.ts` after secrets bootstrap.

## Residual risks

| Risk | Mitigation |
|------|------------|
| ONNX native segfault in `@huggingface/transformers` | Queue + warm load reduce pressure; monitor logs |
| OOM on low-RAM machines | q8 quant + whisper-small; optional `whisper-base` setting later |
| IPC payload memory spike | Keep 120 s cap; consider streaming chunks later |

## Files changed

- `electron/main/local-stt.ts` — queue, errors, warm, limits, Whisper params
- `electron/main/index.ts` — warm load
- `electron/main/ipc.ts` — async handler + logging
- `src/features/speech-to-text/lib/wav-pcm.ts` — resample on decode
