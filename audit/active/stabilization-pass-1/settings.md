# Audit: Settings

**Pass 1:** 🟡 Surface scan  
**Pass 2:** 🟡 In progress

## Scope

- API keys (OpenRouter, custom endpoint)
- Agent defaults, web search toggle, models
- Appearance (theme, density)
- Audio devices, STT/TTS prefs
- Clear app data

## Key paths

| Layer | Paths |
|-------|--------|
| Pages | `src/pages/settings/` |
| Features | `manage-api-keys/`, `user-settings/`, `ai-chat/ui/AgentSettingsForm.tsx`, `text-to-speech/ui/TtsSettingsForm.tsx` |
| Main | secrets / keytar |
| UI | `SettingsInput.tsx`, `SecretKeyRow.tsx`, `FieldContextMenu.tsx` |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| SET-P1-01 | Medium | ✅ Fixed | `FieldContextMenu` `triggerClassName` row layout |
| SET-P1-02 | High | ✅ Fixed | keytar round-trip test; v19 migrates embedded custom key via `secrets.set` |
| SET-P1-03 | Medium | ✅ Fixed | Web search + backend hints match toggle behavior |
| SET-P1-04 | Medium | ✅ Fixed | Invalid custom profile not autosaved; parse error blocks chat-ready |
| SET-P1-05 | Low | ✅ Fixed | `clearAppData` clears message queue store |
| SET-P1-06 | Low | ✅ Fixed | `WebDevSecretsNotice` on General + API settings |

## Pass 1 checklist

- [ ] Each settings section renders without layout break
- [ ] Context menu on secret fields works
- [ ] Model list loads with valid key
- [ ] Theme toggle applies without flash
- [ ] Navigate away → values persisted

## Pass 2

- Audit every form field → store → main IPC
- Invalid key error surfaces in chat vs settings
