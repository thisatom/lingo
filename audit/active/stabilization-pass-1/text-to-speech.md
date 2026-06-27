# Audit: Text-to-speech (TTS)

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Reply Speak button, Agent Speech auto-TTS
- Desktop: edge-tts in main; prod path Azure (if wired)
- Chunking, sentence split, level visualizer
- Stop agent must stop TTS

## Key paths

| Layer | Paths |
|-------|--------|
| Features | `src/features/text-to-speech/` |
| Main | `electron/main/*tts*`, edge-tts provider |
| Shared | `src/shared/api/tts/` |
| UI | `ReplySpeakButton.tsx`, `SpeakingTtsLevel.tsx`, `TtsSettingsForm.tsx` |
| Docs | [`docs/SPEECH_PIPELINE.md`](../../docs/SPEECH_PIPELINE.md) |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| TTS-P1-01 | High | 🟡 Verify | Stop agent → TTS abort immediately |
| TTS-P1-02 | High | Open | Agent Speech: TTS only assistant text, not thinking |
| TTS-P1-03 | Medium | Open | Speak hidden while `agentBusy` on assistant row — UX intent |
| TTS-P1-04 | Medium | Open | Long answers: chunk boundaries / mid-chunk stop |
| TTS-P1-05 | Low | Open | Output device selection vs system default |
| TTS-P1-06 | Low | Open | Web preview Edge TTS parity |

## Pass 1 checklist

- [ ] Speak on completed assistant message → audio plays
- [ ] Stop during TTS → audio stops, no queue leak
- [ ] Agent Speech full turn → TTS after stream done
- [ ] Reasoning model → no TTS on thinking block
- [ ] Settings voice/speed persist

## Pass 2

- Trace IPC cancel path
- Error handling when edge-tts fails (network, voice id)
- Concurrent Speak on two messages
