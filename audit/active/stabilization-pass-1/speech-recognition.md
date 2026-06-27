# Audit: Speech recognition (STT)

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress  
**Detail reports:** [`../speech-recognition/`](../speech-recognition/)

## Scope

- Desktop: Whisper ONNX in main (`local-stt.ts`)
- Web: Web Speech API fallback
- Audio prep: WAV, resample, enhance, noise suppression settings
- Warm load, queue, error surfaces

## Key paths

| Layer | Paths |
|-------|--------|
| Main | `electron/main/local-stt.ts`, `wav-pcm.ts` |
| Features | `src/features/speech-to-text/`, `voice-input/model/useWhisperVoiceInput.ts`, `useRecordedVoiceInput.ts` |
| IPC | `lingo:stt:transcribe` |
| Tests | `whisper-transcript.test.ts`, `whisper-audio-ctx.test.ts` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| STT-P1-01 | High | ✅ Fixed | Serial STT queue — verify no regression |
| STT-P1-02 | High | ✅ Fixed | Auto-resample unsupported sample rate |
| STT-P1-03 | Medium | ✅ Fixed | Devices settings copy: first-run Whisper download (~190 MB) |
| STT-P1-04 | Medium | Open | Quiet speech / threshold tuning (main process) |
| STT-P1-05 | Low | ✅ Fixed | Removed dead `useVoiceCapture.ts` |
| STT-P1-06 | Medium | ✅ Fixed | STT errors shown while transcribing; generic mic error skipped if STT set |

## Pass 1 checklist

- [ ] Cold start → warm load log, first mic not multi-minute hang
- [ ] Short utterance → transcript or «hold longer» message
- [ ] Double-stop mic → main process stable
- [ ] 2 min cap → `RECORDING_TOO_LONG`
- [ ] Settings noise suppression levels documented in UI

## Pass 2

- Hardware matrix (Bluetooth mic, USB)
- Compare Whisper transcript vs browser STT on same phrase (web preview)
- Memory under repeated transcribe
