# Пайплайн речи

## Поток данных

```
[User speaks]
     ↓
voice-capture (audio stream / chunks)
     ↓
speech-to-text (Transcript)
     ↓
ai-chat (user message + history + target language)
     ↓
text-to-speech (audio playback)
     ↓
[User hears assistant]
```

## Состояния UI

| Состояние | Описание |
|-----------|----------|
| `idle` | Ожидание |
| `listening` | Идёт запись |
| `transcribing` | STT |
| `thinking` | Запрос к AI |
| `speaking` | TTS |
| `error` | Ошибка с возможностью retry |

## Feature-слайсы (план)

### voice-capture

- Запрос разрешения микрофона
- Start/stop запись
- Визуализация уровня (опционально)

### speech-to-text

- Вход: `Blob` | `AudioBuffer` | поток
- Выход: `Transcript { text, language, isFinal }`
- Провайдер: TBD (Web Speech API, Whisper API, cloud STT)

### ai-chat

- Вход: текст пользователя, `conversationId`, `practiceLanguage`
- Выход: текст ассистента
- Системный промпт: роль языкового партнёра, исправления, уровень сложности

### text-to-speech

- Вход: текст ответа, locale
- Выход: воспроизведение
- **Dev:** edge-tts в `electron/main`, аудио в renderer по IPC
- **Prod:** Azure Speech TTS (желательно тот же провайдер, что STT)
- Абстракция: `TtsProvider` — см. [STACK.md](./STACK.md)

## Обработка ошибок

- Нет микрофона → понятное сообщение в UI
- STT пустой → не вызывать AI
- AI timeout → retry, сохранить черновик сообщения пользователя
- TTS fail → показать текст ответа

## Конфиденциальность

- Не логировать сырой аудио и полные промпты в production
- API key только из env / secure storage
