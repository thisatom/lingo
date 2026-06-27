# Stabilization audit — Pass 1 (surface scan)

**Цель:** стабилизировать UI и логику Lingo — найти баги, расхождения с контрактами, слабые тесты и UX-регрессии.

**Дата старта:** 2026-06-24  
**Фаза:** **Pass 1** — поверхностный прогон по доменам (этот каталог).  
**Фаза 2:** глубокий аудит **по одному файлу** → спринты фиксов → ручной QA → закрытие в `archive/`.

## Workflow

| Шаг | Действие |
|-----|----------|
| 1 | Прочитать `SUMMARY.md` и выбрать домен |
| 2 | Открыть `*.md` домена — пройти чеклист Pass 1, дописать находки |
| 3 | Завести ID (`CA-`, `WS-`, `TTS-`, …) в таблице домена |
| 4 | Pass 2: тот же файл → секция «Deep dive» + тест-план + приоритет |
| 5 | После закрытия домена — статус ✅ в `SUMMARY.md` |
| 6 | Когда все домены закрыты — перенести `stabilization-pass-1/` в `archive/YYYY-MM-DD-stabilization-pass-1/` |

## Severity

| Level | Meaning |
|-------|---------|
| **Critical** | Потеря данных, неверный ответ, сломан основной поток |
| **High** | Сильная UX-регрессия или нарушение контракта |
| **Medium** | Edge-case, perf, неочевидный баг |
| **Low** | Полировка, доки, пробелы в тестах |

## Домены (файлы Pass 1)

| # | Домен | Файл |
|---|--------|------|
| 1 | Агент чата (LLM, turn, stop/continue) | [chat-agent.md](./chat-agent.md) |
| 2 | Web search | [web-search.md](./web-search.md) |
| 2b | Agent × local search | [local-web-search-agent.md](./local-web-search-agent.md) |
| 3 | Распознавание речи (STT) | [speech-recognition.md](./speech-recognition.md) |
| 4 | Озвучка (TTS) | [text-to-speech.md](./text-to-speech.md) |
| 5 | Голосовой ввод / микрофон | [voice-input.md](./voice-input.md) |
| 6 | Настройки | [settings.md](./settings.md) |
| 7 | Обновление приложения | [app-update.md](./app-update.md) |
| 8 | Store / персистентность | [store-persistence.md](./store-persistence.md) |
| 9 | UI чата (панель, скролл, turns) | [conversation-ui.md](./conversation-ui.md) |
| 10 | Композер | [chat-composer.md](./chat-composer.md) |
| 11 | Стриминг / санитизация | [streaming-sanitization.md](./streaming-sanitization.md) |
| 12 | Сайдбар / чаты / навигация | [sidebar-chats.md](./sidebar-chats.md) |
| 13 | Electron / desktop | [electron-desktop.md](./electron-desktop.md) |
| 14 | Web preview | [web-preview.md](./web-preview.md) |
| 15 | Onboarding / welcome | [onboarding.md](./onboarding.md) |
| 16 | Перевод сообщений | [message-translate.md](./message-translate.md) |
| 17 | Вложения | [chat-attachments.md](./chat-attachments.md) |

## Ссылки

- Контракт агента: [`docs/CHAT_AGENT.md`](../../docs/CHAT_AGENT.md)
- План стабилизации: [`docs/CHAT_AGENT_STABILITY_PLAN.md`](../../docs/CHAT_AGENT_STABILITY_PLAN.md)
- Ручной QA агента: [`docs/CHAT_AGENT_MANUAL_QA.md`](../../docs/CHAT_AGENT_MANUAL_QA.md)
- Пайплайн речи: [`docs/SPEECH_PIPELINE.md`](../../docs/SPEECH_PIPELINE.md)
- Архив прошлых аудитов: [`../archive/`](../archive/)
