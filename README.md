# Lingo

Десктопное приложение (**React + Electron**) для тренировки разговорной речи на разных языках.

**Микрофон → STT → AI → TTS**

## Запуск

```bash
npm install
npm run dev
```

Сборка: `npm run build` · проверка типов: `npm run typecheck`

1. Откройте **Settings** и сохраните [OpenRouter](https://openrouter.ai/) API key.
2. На главном экране **удерживайте кнопку микрофона**, говорите и отпустите — или введите текст. Ответ озвучится (edge-tts).

Опционально: `.env` с `LINGO_OPENROUTER_API_KEY` для dev (см. `docs/env.example.md`).

## Статус

MVP: Electron + React (FSD), shadcn/ui, OpenRouter, edge-tts, смена ключей, **голосовой ввод** (Web Speech API).

Ранее в репозитории была только структура контекста; сейчас есть рабочий каркас приложения:

- [`AGENTS.md`](./AGENTS.md) — главный контекст для AI-агента
- [`.cursor/rules/`](./.cursor/rules/) — правила Cursor
- [`docs/`](./docs/) — архитектура, FSD, пайплайн речи
- Каркас папок `src/` (FSD) и `electron/`

## Документация

| Файл | Описание |
|------|----------|
| [AGENTS.md](./AGENTS.md) | Контекст для агента |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Процессы, titlebar, схема |
| [docs/FSD.md](./docs/FSD.md) | Слои и слайсы |
| [docs/UI.md](./docs/UI.md) | shadcn/ui, Tailwind, FSD |
| [docs/STACK.md](./docs/STACK.md) | AI SDK, LangGraph, edge-tts, Azure TTS |
| [docs/OPENROUTER.md](./docs/OPENROUTER.md) | OpenRouter API |
| [docs/API_KEYS.md](./docs/API_KEYS.md) | Смена ключей в настройках |
| [docs/SPEECH_PIPELINE.md](./docs/SPEECH_PIPELINE.md) | STT → AI → TTS |
| [docs/env.example.md](./docs/env.example.md) | Шаблон переменных окружения |

## Планируемый стек

- React, TypeScript, Electron, **shadcn/ui**, Tailwind
- Feature-Sliced Design (`src/`)
- Окно: [`@incanta/custom-electron-titlebar`](https://www.npmjs.com/package/@incanta/custom-electron-titlebar)

## Лицензия

См. [LICENSE](./LICENSE).
