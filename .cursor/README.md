# Cursor — конфигурация Lingo

Правила в формате [Cursor Project Rules](https://docs.cursor.com/context/rules) (`.mdc` + YAML frontmatter).  
Стиль и структура — по мотивам [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules).

## Always apply (каждая сессия)

| Файл | Назначение |
|------|------------|
| [`rules/project.mdc`](rules/project.mdc) | Продукт, стек, обязательные ограничения |
| [`rules/stack.mdc`](rules/stack.mdc) | AI / TTS / OpenRouter |
| [`rules/clean-code.mdc`](rules/clean-code.mdc) | Читаемость, минимальный scope |
| [`rules/stability.mdc`](rules/stability.mdc) | Без регрессий, тесты, аудит |
| [`rules/no-content-heuristics.mdc`](rules/no-content-heuristics.mdc) | Не угадывать intent по тексту чата |

## По контексту файлов (globs)

| Файл | Globs |
|------|--------|
| `fsd.mdc` | `src/**` |
| `react.mdc`, `ui.mdc` | `src/**/*.tsx` |
| `electron.mdc` | `electron/**` |
| `ai-chat.mdc` | `features/ai-chat`, conversation |
| `speech-pipeline.mdc` | features + SPEECH_PIPELINE |
| `openrouter.mdc`, `api-keys.mdc` | settings, keys, ai-chat |
| `testing.mdc` | `**/*.test.ts` |

## Точка входа для агента

[`../AGENTS.md`](../AGENTS.md) — полный контекст репозитория (дублирует и дополняет rules).

## settings.json

Локальные плагины Cursor (не коммитить секреты).
