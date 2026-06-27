# Lingo — контекст для AI-агента

Руководство для Cursor / coding agents. Правила проекта: [`.cursor/rules/`](.cursor/rules/) (формат [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)).

---

## Роль

Ты — senior engineer в репозитории **Lingo**: React + Electron + TypeScript, FSD.  
Цель работы: **стабильная версия** — минимальные точечные фиксы, тесты, без регрессий.

---

## Принципы (всегда)

### 1. Clean code

- Минимальный scope diff; не рефакторить «заодно».
- Логику агента — в `features/ai-chat/lib/`, не в монолитном хуке.
- Имена и типы на границах IPC/store; без `any` и пустых catch.
- Подробнее: [`.cursor/rules/clean-code.mdc`](.cursor/rules/clean-code.mdc)

### 2. Стабильность

- Перед правкой — контракт домена; после — `npm test`.
- Не ослаблять тесты; регрессия → новый тест.
- Аудит: [`audit/active/stabilization-pass-1/`](audit/active/stabilization-pass-1/)
- Подробнее: [`.cursor/rules/stability.mdc`](.cursor/rules/stability.mdc)

### 3. Не угадывать intent по тексту

**Запрещено** добавлять проверки содержимого сообщения или стрима агента (regex «погода», «news», «what is», factual/casual classifiers).

Разрешено: **настройки UI**, **явные команды** («search the web»), **stage/flags** из store и IPC.

Legacy `web-search-intent.ts` — не расширять; при рефакторе убирать keyword-intent.

Подробнее: [`.cursor/rules/no-content-heuristics.mdc`](.cursor/rules/no-content-heuristics.mdc)

---

## Продукт

Пользователь: микрофон → STT → AI (OpenRouter) → TTS. Тренировка разговорной речи.  
Есть **web preview** (`npm run dev:web`) с ограниченным паритетом.

| Слой | Технология |
|------|------------|
| UI | React, TypeScript, shadcn/ui, Tailwind |
| Desktop | Electron + electron-vite |
| Окно | `@incanta/custom-electron-titlebar` (main) |
| Архитектура UI | [Feature-Sliced Design](https://feature-sliced.design/) |
| AI | OpenRouter; optional custom endpoint |
| Ключи (desktop) | Settings → keytar (main) |
| Ключи (web) | localStorage — dev only |
| TTS (desktop dev) | edge-tts (main) |
| STT (desktop) | Whisper in main; Web Speech in web preview |

Docs: [`docs/STACK.md`](docs/STACK.md), [`docs/UI.md`](docs/UI.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/FSD.md`](docs/FSD.md).

---

## Структура репозитория

```
lingo/
├── AGENTS.md
├── .cursor/rules/          # Project Rules (.mdc)
├── electron/main/          # IPC, STT/TTS, secrets, stream proxy
├── electron/preload/
├── src/                    # renderer (FSD)
│   ├── app/
│   ├── pages/
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   └── shared/
├── docs/
├── audit/                  # stabilization audits
└── vite/
```

---

## FSD

| Слой | Lingo |
|------|--------|
| `app` | providers, global styles, gates |
| `pages` | main, welcome, settings |
| `widgets` | conversation panel, composer |
| `features` | ai-chat, voice-input, TTS, keys, attachments |
| `entities` | chat, message, settings |
| `shared` | ui kit, lingo API, IPC types |

Импорты **только сверху вниз**. См. [`.cursor/rules/fsd.mdc`](.cursor/rules/fsd.mdc).

---

## Electron

| Процесс | Ответственность |
|---------|-----------------|
| Main | windows, titlebar, IPC, secrets, chat stream, STT/TTS |
| Preload | `contextBridge` → `window.lingo` |
| Renderer | React; **не** хранит ключи; **не** OpenRouter напрямую (desktop) |

См. [`.cursor/rules/electron.mdc`](.cursor/rules/electron.mdc), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Чат-агент (критичный домен)

| Документ | Назначение |
|----------|------------|
| [`docs/CHAT_AGENT.md`](docs/CHAT_AGENT.md) | Контракт поведения |
| [`docs/CHAT_AGENT_STABILITY_PLAN.md`](docs/CHAT_AGENT_STABILITY_PLAN.md) | План стабилизации |
| [`docs/CHAT_AGENT_MANUAL_QA.md`](docs/CHAT_AGENT_MANUAL_QA.md) | Ручной QA перед релизом |
| [`.cursor/rules/ai-chat.mdc`](.cursor/rules/ai-chat.mdc) | Правила для кода агента |

Stop → `executeAgentStop`; partial + Continue; фоновый стрим без лишнего `force: true`.

---

## Workflow агента

### Перед изменением кода

1. Прочитать релевантные `.cursor/rules/*.mdc` и `docs/`.
2. Найти существующие тесты и call sites.
3. Для ai-chat — затронутые сценарии из Manual QA.

### При реализации

- Соблюдать FSD и границу main vs renderer.
- CSP: `shared/config/content-security-policy.ts` + `vite/inject-csp.ts`.
- Titlebar только в main.
- **Не** добавлять keyword-intent по тексту пользователя.

### Перед завершением задачи

1. `npm test` (минимум затронутые модули).
2. Обновить контракт/docs, если поведение изменилось.
3. Запись в audit-домен, если это stabilization fix.

### Коммиты и PR

- Коммит **только по запросу** пользователя.
- PR: summary + test plan; для ai-chat — пункты из `CHAT_AGENT.md` checklist.

---

## Cursor rules — индекс

| Rule | Scope |
|------|--------|
| `project.mdc`, `stack.mdc` | always |
| `clean-code.mdc`, `stability.mdc`, `no-content-heuristics.mdc` | always |
| `fsd.mdc` | `src/**` |
| `react.mdc`, `ui.mdc` | TSX |
| `electron.mdc` | `electron/**` |
| `ai-chat.mdc` | agent + stream |
| `speech-pipeline.mdc` | voice pipeline |
| `openrouter.mdc`, `api-keys.mdc` | keys |
| `testing.mdc` | `*.test.ts` |

Полный индекс: [`.cursor/README.md`](.cursor/README.md).

---

## Ссылки

- [OpenRouter](docs/OPENROUTER.md) · [API keys](docs/API_KEYS.md)
- [Speech pipeline](docs/SPEECH_PIPELINE.md)
- [Stabilization audit](audit/active/stabilization-pass-1/SUMMARY.md)
- [Feature-Sliced Design](https://feature-sliced.design/)
