# Lingo — контекст для AI-агента

**Lingo** — десктопное приложение (React + Electron + TypeScript) для тренировки разговорной речи на разных языках. Есть также **web preview** (`npm run dev:web` / `build:web`) с ограниченным паритетом.

## Продукт

Пользователь говорит в микрофон → речь в текст (STT) → текст уходит в AI (OpenRouter или custom LLM) → ответ AI → ответ озвучивается (TTS).

## Стек (текущий)

| Слой | Технология |
|------|------------|
| UI | React, TypeScript, **shadcn/ui**, Tailwind CSS |
| Desktop | **Electron** + **electron-vite** |
| Окно | `@incanta/custom-electron-titlebar` (настройка в **main**) |
| Архитектура UI | [Feature-Sliced Design](https://feature-sliced.design/) |
| AI | **OpenRouter** (OpenAI-compatible); опционально custom endpoint |
| Ключи (desktop) | Settings UI → **keytar** в main |
| Ключи (web preview) | `localStorage` — только для dev, не production-safe |
| TTS (dev desktop) | **edge-tts** в main |
| STT (desktop) | Whisper ONNX в main; в renderer — Web Speech (browser backend) |

Подробности: [`docs/STACK.md`](docs/STACK.md), [`docs/UI.md`](docs/UI.md), [`docs/OPENROUTER.md`](docs/OPENROUTER.md), [`docs/API_KEYS.md`](docs/API_KEYS.md).

## Структура репозитория

```
lingo/
├── AGENTS.md
├── electron/                 # main, preload
│   └── main/                 # IPC, окна, STT/TTS, secrets, welcome flow
├── src/                      # renderer (FSD)
│   ├── app/
│   ├── pages/                # main, welcome, settings
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   └── shared/
├── index.html                # Electron renderer shell
├── index.web.html            # Web build entry
├── docs/
└── vite/                     # inject-csp и прочие Vite-плагины
```

## FSD — куда класть код

| Слой | Назначение в Lingo |
|------|-------------------|
| `app` | Провайдеры, глобальные стили, shutdown overlay |
| `pages` | Главный диалог, welcome, настройки |
| `widgets` | Панель чата, composer |
| `features` | STT, AI chat, TTS, API keys, voice input |
| `entities` | chat, settings, message |
| `shared` | UI kit, API (`lingo`), конфиг, типы IPC |

Импорты только **сверху вниз**. См. `docs/FSD.md`.

## Electron

- **Main** (`electron/main/`): окна, titlebar, IPC, secrets, chat stream proxy, link preview, welcome probe.
- **Preload** (`electron/preload/`): `contextBridge` → `window.lingo`.
- **Renderer** (`src/`): React; **не** хранит API-ключи и **не** ходит в OpenRouter напрямую (кроме Web Speech для browser STT).

См. `docs/ARCHITECTURE.md`, `.cursor/rules/electron.mdc`.

## Пайплайн речи

1. **Capture** — `features/voice-capture`, `features/voice-input`
2. **STT** — main (Whisper) или Web Speech в renderer
3. **AI** — `features/ai-chat` → IPC `lingo:chat:stream` (desktop) / `browser-lingo` (web)
4. **TTS** — main edge-tts (desktop) / Edge web API (web preview)

См. `docs/SPEECH_PIPELINE.md`, `docs/voice-input-architecture.md`.

## Секреты

- Desktop: **keytar** в main; renderer не читает ключи (`readSecretKey` бросает на Electron).
- Web preview: `src/shared/api/web-secrets.ts` (plain localStorage).
- `.env` — dev-fallback для main: `docs/env.example.md`.

## Что делать агенту

1. Читать `.cursor/rules/*.mdc` и `docs/`.
2. Соблюдать FSD и границу main vs renderer.
3. Titlebar — только `@incanta/custom-electron-titlebar` в main.
4. CSP для HTML — через `src/shared/config/content-security-policy.ts` + `vite/inject-csp.ts`.
5. Минимальный дифф.

## Ссылки

- [Feature-Sliced Design](https://feature-sliced.design/)
- [@incanta/custom-electron-titlebar](https://www.npmjs.com/package/@incanta/custom-electron-titlebar)
