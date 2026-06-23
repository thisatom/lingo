# STT audit: accuracy & optimization

## Accuracy levers (applied)

### Whisper decode (main)

In `local-stt.ts`:

- Model: `Xenova/whisper-small` (q8) — better WER than tiny/base on multilingual speech.
- `language` from Settings `practiceLanguage` (ISO prefix).
- `chunk_length_s: 30`, `stride_length_s: 5` — overlap reduces word loss at chunk boundaries.
- `no_speech_threshold: 0.35` (default ~0.6) — keeps quiet syllables.
- `logprob_threshold: -1.0`, `compression_ratio_threshold: 2.4` — standard Whisper fallback tuning.

### Preprocessing (renderer, before IPC)

`enhanceSpeechAudio()` in `ensure-wav-for-local-stt.ts`:

- Default `micNoiseSuppression: light` — high-pass + RMS normalize only; avoids trimming inter-word pauses.
- **Changed:** `TARGET_RMS` 0.10 → 0.12, `MAX_GAIN` 8 → 10 for soft speech.

**Settings guidance:** Strong suppression helps noisy rooms but can clip word edges; recommend **Light** for language practice.

### Capture

- Prefer AudioWorklet WAV at 16 kHz (`preferWav: true` in `useRecordedVoiceInput`).
- Minimum duration 350 ms + 0.25 s samples in `wav-recorder.ts`.

## Optimization (applied)

| Change | Benefit |
|--------|---------|
| `warmLocalStt()` on startup | Hides model download from first mic press |
| STT job queue | One inference at a time → lower peak RAM |
| Shared `resampleMono` | Less duplicate work; safe main decode |
| Structured errors | Faster failure without retry storms |

## Backlog (not in this PR)

1. **Settings: STT model tier** — small / medium (accuracy vs RAM).
2. **VAD pre-check** — skip IPC when RMS near zero.
3. **faster-whisper** — if CPU latency remains unacceptable.
4. **Partial results** — Web Speech already live; local Whisper stays batch-only.
5. **Unit tests** for `enhanceSpeechAudio` level matrix.

## Alternative libraries (evaluation)

| Option | Pros | Cons |
|--------|------|------|
| **Transformers.js (current)** | Pure JS/ONNX, already wired | CPU-heavy; rare native crashes |
| faster-whisper (Python sidecar) | Fast, accurate | Extra process, packaging |
| whisper.cpp (node binding) | Fast on CPU | Native build per platform |
| Cloud STT (OpenRouter/Azure) | Best accuracy | Cost, privacy, keys |

**Recommendation:** Stay on Transformers.js until stability proven insufficient; then evaluate whisper.cpp in main only.
