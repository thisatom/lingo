# manage-api-keys

Смена API-ключей в runtime (без пересборки).

- **OpenRouter** — обязательный для AI-чата
- **Azure Speech** — когда подключён prod TTS/STT

Сохранение через IPC → `electron/main` (secure storage). См. `docs/API_KEYS.md`.
