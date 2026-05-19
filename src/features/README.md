# features

Пользовательские сценарии и действия.

План:

- `voice-input` — микрофон + live STT (см. [docs/voice-input-architecture.md](../../docs/voice-input-architecture.md))
- `voice-capture` — UI кнопки микрофона
- `speech-to-text` — STT
- `ai-chat` — OpenRouter + Vercel AI SDK / OpenAI SDK (см. `docs/OPENROUTER.md`)
- `manage-api-keys` — смена OpenRouter и других ключей (`docs/API_KEYS.md`)
- `text-to-speech` — TTS через `TtsProvider` (dev: edge-tts в main, prod: Azure)
- `language-select` — язык тренировки

См. [docs/voice-input-architecture.md](../../docs/voice-input-architecture.md) и [docs/SPEECH_PIPELINE.md](../../docs/SPEECH_PIPELINE.md).
