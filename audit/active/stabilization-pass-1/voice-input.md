# Audit: Voice input / microphone

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- Composer mic button, hold-to-talk vs tap
- Live conversation mode (Agent Speech)
- Device picker, level meter
- Interaction with agent busy / stop / send

## Key paths

| Layer | Paths |
|-------|--------|
| Features | `voice-input/`, `voice-capture/`, `audio-devices/` |
| Widget | `src/widgets/chat-composer/ui/ChatComposer.tsx` |
| UI | `VoiceRecordButton.tsx`, `ComposerMicLevel.tsx`, `VoiceCaptureBar.tsx` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| VI-P1-01 | Medium | ✅ Fixed | Mic + Send together when text present |
| VI-P1-02 | Medium | ✅ Fixed | `voiceDisabled` not blocked by `agentBusy` |
| VI-P1-03 | High | Open | Agent Speech: mic re-open timing after TTS end |
| VI-P1-04 | Medium | Open | Permission denied / no mic device UX |
| VI-P1-05 | Medium | Open | Recording indicator vs pipeline stage sync |
| VI-P1-06 | Low | Open | Hotkey for voice mode (`useChatComposerModeHotkey`) |

## Pass 1 checklist

- [ ] Empty composer + agent idle → mic only
- [ ] Text in composer → mic + send
- [ ] Agent busy + no text → stop + mic
- [ ] Agent busy + text → stop + mic + send
- [ ] Switch input device mid-session

## Pass 2

- End-to-end Agent Speech loop timing
- Web preview mic path only (no Whisper)
