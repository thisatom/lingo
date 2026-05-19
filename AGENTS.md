# Lingo — контекст для AI-агента

**Lingo** — десктопное приложение (React + Electron) для тренировки разговорной речи на разных языках.

На этом этапе в репозитории только **структура контекста** (правила, документация, каркас FSD). Исходный код приложения ещё не реализован.

## Продукт

Пользователь говорит в микрофон → речь в текст (STT) → текст уходит в AI по API-ключу → ответ AI → ответ озвучивается (TTS).

Цель: живой диалог на выбранном языке с обратной связью от модели.

## Стек (план)

| Слой | Технология |
|------|------------|
| UI | React, TypeScript, **shadcn/ui**, Tailwind CSS |
| Desktop | Electron |
| Окно | `@incanta/custom-electron-titlebar` |
| Архитектура UI | [Feature-Sliced Design](https://feature-sliced.design/) |
| Сборка (план) | Vite + electron-vite или аналог |

## Инструменты AI и TTS (зафиксировано)

| Слой | Инструмент |
|------|------------|
| Диалог, streaming, история | **Vercel AI SDK** или **OpenAI SDK + свой store** |
| Сложные сценарии позже | **LangGraph** |
| TTS на этапе разработки | **edge-tts** (main process) |
| TTS для релиза | **Azure Speech** (или тот же провайдер, что STT) |
| AI-провайдер | **OpenRouter** (OpenAI-compatible API) |
| API-ключи | Смена в **Settings**; хранение в main (`safeStorage`) |

Подробности: [`docs/STACK.md`](docs/STACK.md), [`docs/UI.md`](docs/UI.md), [`docs/OPENROUTER.md`](docs/OPENROUTER.md), [`docs/API_KEYS.md`](docs/API_KEYS.md).

## Структура репозитория

```
lingo/
├── AGENTS.md                 # этот файл
├── .cursor/rules/            # правила для Cursor
├── docs/                     # архитектура и контракты
├── electron/                 # main, preload (пока только README)
└── src/                      # renderer, FSD-слои (пока только README)
    ├── app/
    ├── pages/
    ├── widgets/
    ├── features/
    ├── entities/
    └── shared/
```

## FSD — куда класть код

| Слой | Назначение в Lingo |
|------|-------------------|
| `app` | Провайдеры, роутинг, инициализация titlebar, глобальные стили |
| `pages` | Экраны: главный диалог, настройки, выбор языка |
| `widgets` | Крупные блоки UI: панель чата, индикатор записи |
| `features` | Действия: запись, STT, запрос к AI, TTS, выбор языка, **manage-api-keys** |
| `entities` | Модели: сообщение, сессия, язык, **api-credential** |
| `shared` | **shadcn/ui** (`ui/`), API-клиент, `cn()` в `lib/`, конфиг, типы |

Импорты только **сверху вниз** (pages → widgets → features → entities → shared). См. `docs/FSD.md`.

## Electron

- **Main** (`electron/main/`): `BrowserWindow`, titlebar через `@incanta/custom-electron-titlebar`, IPC, без React.
- **Preload** (`electron/preload/`): безопасный мост `contextBridge`.
- **Renderer** (`src/`): React + FSD.

См. `docs/ARCHITECTURE.md` и `.cursor/rules/electron.mdc`.

## Пайплайн речи

1. **Capture** — микрофон (`features/voice-capture` — план).
2. **STT** — speech-to-text (`features/speech-to-text`).
3. **AI** — OpenRouter (`features/ai-chat`); ключ из secure storage / `entities/api-credential` / settings.
4. **TTS** — `features/text-to-speech` через `TtsProvider`: dev — edge-tts (main), prod — Azure Speech.

См. `docs/SPEECH_PIPELINE.md`, `docs/STACK.md`.

## Секреты и ключи

- **OpenRouter** — основной ключ для AI; пользователь меняет в `pages/settings` (`features/manage-api-keys`).
- Хранение: **electron/main** + **keytar** (OS keychain), не в git, не в `localStorage`.
- `.env` — только dev-fallback: `docs/env.example.md`.
- Документация: `docs/API_KEYS.md`, `docs/OPENROUTER.md`.

## Что делать агенту при реализации

1. Читать `.cursor/rules/*.mdc` и `docs/`.
2. Соблюдать FSD и границы electron/main vs renderer.
3. Titlebar — только через `@incanta/custom-electron-titlebar` в main.
4. Не смешивать STT/AI/TTS в одном файле — отдельные features с явными портами.
5. Минимальный дифф; не переусложнять до появления реальных требований.

## Ссылки

- [Feature-Sliced Design](https://feature-sliced.design/)
- [@incanta/custom-electron-titlebar](https://www.npmjs.com/package/@incanta/custom-electron-titlebar)
