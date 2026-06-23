# Speech recognition audit — executive summary

**Date:** 2026-06-23  
**Scope:** Desktop local Whisper (main) + browser Web Speech fallback  
**Status:** Fixes applied in code; see backlog for optional upgrades

## Architecture (verified)

```
Mic → wav-recorder (16 kHz mono WAV) or MediaRecorder (webm)
  → ensureWavForLocalStt (decode + enhanceSpeechAudio)
  → IPC lingo:stt:transcribe
  → electron/main/local-stt.ts (Xenova/whisper-small q8, Transformers.js)
  → transcript → composer / conversation
```

Browser build: `selectSttBackend()` → Web Speech API (`useBrowserSpeechVoiceInput`).

## Top issues found

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| STT-1 | **Critical** | Concurrent transcribe + model load could race / OOM in main | Serial STT queue in `local-stt.ts` |
| STT-2 | **Critical** | `UNSUPPORTED_SAMPLE_RATE` hard-threw on decode → IPC error / perceived crash | Auto-resample in `wav-pcm.ts` |
| STT-3 | **High** | Unhandled inference errors surfaced as raw throws | Structured `STT_*` errors + IPC logging |
| STT-4 | **High** | First mic use blocked on ~150 MB model download | `warmLocalStt()` on app start |
| STT-5 | **Medium** | Quiet / mumbled speech dropped (`no_speech_threshold` default) | Lower Whisper thresholds + slightly higher RMS gain |
| STT-6 | **Medium** | Strong noise suppression trims word edges | Default remains `light`; document trade-off in Settings |
| STT-7 | **Low** | Error copy said ~40 MB model | Updated to ~150 MB |
| STT-8 | **Low** | `useVoiceCapture` bypasses enhancement (unused in UI) | Dead path; main flow uses `useRecordedVoiceInput` |

## Library choice

**Keep `@huggingface/transformers` + Xenova/whisper-small (q8)** for MVP:

- Free, on-device, no API key
- Already integrated in main (CSP-safe)
- `whisper-small` is the best accuracy/size trade-off on CPU

**Not switching now:** faster-whisper / whisper.cpp (native addon + packaging cost). Revisit if Transformers.js still segfaults on target hardware after queue + warm-load fixes.

## Reports

- [crashes-stability.md](./crashes-stability.md)
- [accuracy-optimization.md](./accuracy-optimization.md)

## Test plan (manual)

1. Fresh install → app start → wait for `[lingo stt] Whisper ready` in terminal.
2. Short phrase (<1 s) → expect transcript or “Hold the mic button longer…”.
3. Quiet / unclear speech → more words captured vs before.
4. Rapid double-stop mic → no main process exit.
5. 2 min recording → `RECORDING_TOO_LONG` message, no crash.
6. Web preview → browser STT still works when `window.lingo` absent.
