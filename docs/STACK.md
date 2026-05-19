# Стек инструментов Lingo

Зафиксированный выбор **инструментов управления моделью и озвучки** (не конкретные LLM-модели вроде gpt-4o).

## Таблица решений

| Слой | Инструмент |
|------|------------|
| Диалог, streaming, история | **Vercel AI SDK** или **OpenAI SDK + свой store** |
| Сложные сценарии позже | **LangGraph** |
| TTS на этапе разработки | **edge-tts** (main process) |
| TTS для релиза | **Azure Speech** (или тот же провайдер, что STT) |
| AI API | **OpenRouter** |
| API-ключи | **Settings** + secure storage в main (**смена без пересборки**) |
| UI / UX | **shadcn/ui** + Tailwind (`src/shared/ui/`) |

## AI-провайдер: OpenRouter

- Все запросы к LLM — через **[OpenRouter](https://openrouter.ai/)** (`baseURL`: `https://openrouter.ai/api/v1`).
- Ключ: **OpenRouter API key**; пользователь **может менять** его в настройках (см. [API_KEYS.md](./API_KEYS.md), [OPENROUTER.md](./OPENROUTER.md)).
- Модель — ID OpenRouter (`openai/gpt-4o-mini`, …), выбор в settings.

## Диалог и управление моделью

### MVP: Vercel AI SDK или OpenAI SDK + store

- **Vercel AI SDK** + `createOpenAI({ baseURL: OpenRouter, apiKey })` — предпочтительно.
- **OpenAI SDK** + тот же `baseURL` — альтернатива.

Оба варианта допустимы; не подключать LangChain/LangGraph на старте без явной необходимости.

Размещение в FSD:

- `features/ai-chat/` — вызов SDK, streaming, abort
- `features/manage-api-keys/` — ввод, смена, очистка ключей
- `entities/conversation/` — история сообщений, session
- `entities/api-credential/` — статус ключей (configured, masked)
- `shared/api/openrouter/` — клиент, типы
- `pages/settings/` — UI ключей и модели

### Позже: LangGraph

Подключать, когда появятся **ветвящиеся сценарии**: несколько шагов агента, tools с циклами, checkpoint, human-in-the-loop. Для линейного «STT → ответ → TTS» не требуется.

## TTS

### Разработка: edge-tts

- Пакет в экосистеме Node (например `edge-tts-universal` / `node-edge-tts`) — уточнить при scaffold.
- Запуск только в **`electron/main`**, не в renderer.
- Аудио в UI — через IPC (буфер или stream).
- Неофициальный API Microsoft: подходит для **dev/MVP**, не как единственная опора продакшена.

### Релиз: Azure Speech TTS

- Официальный API, стабильность, SLA, те же neural-голоса по locale.
- По возможности **тот же провайдер, что STT** (Azure Speech), чтобы не плодить интеграции.

### Абстракция

TTS за интерфейсом провайдера в `shared/api/tts/`:

```typescript
interface TtsProvider {
  synthesize(text: string, locale: string): Promise<ArrayBuffer>;
}
```

Реализации: `EdgeTtsProvider` (dev), `AzureTtsProvider` (prod). UI и `features/text-to-speech` зависят только от интерфейса.

## Связанные документы

- [UI.md](./UI.md)
- [OPENROUTER.md](./OPENROUTER.md)
- [API_KEYS.md](./API_KEYS.md)
- [SPEECH_PIPELINE.md](./SPEECH_PIPELINE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PLANNED_DEPENDENCIES.md](./PLANNED_DEPENDENCIES.md)
