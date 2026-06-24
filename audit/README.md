# Lingo — аудиты чата

Папка для **регрессионных аудитов** подсистемы чата (streaming, web search, UI, store).

## Структура

| Папка | Назначение |
|-------|------------|
| [`active/`](./active/) | Текущий статус: что закрыто, что отложено, чеклисты для следующих прогонов |
| [`archive/`](./archive/) | Снимки прошлых аудитов — **не править**, только для истории |

## Workflow

1. **Новый аудит** — положить отчёты в `active/` (или подпапку `active/YYYY-MM-DD-topic/`).
2. **После фиксов** — обновить `active/SUMMARY.md` (статусы, ссылки на PR/коммиты).
3. **Архивация** — когда `active/` устарел, перенести целиком в `archive/YYYY-MM-DD-<label>/` и начать новый `active/`.

Именование архива: `YYYY-MM-DD-<краткое-описание>` (например `2026-05-28-baseline`).

## Severity

| Level | Meaning |
|-------|---------|
| **Critical** | Потеря данных, неверные ответы, сломанный основной поток |
| **High** | Сильная UX-регрессия или нарушение контракта |
| **Medium** | Заметные edge-case или perf |
| **Low** | Полировка, пробелы в тестах |

## Ссылки

- [Chat agent rework — **closed**](./archive/2026-06-24-chat-agent-rework-closure/SUMMARY.md) (2026-06-24) — sprints A–D
- [UI/UX audit — **closed**](./archive/2026-06-23-ui-ux-closure/SUMMARY.md) (2026-06-23)
- [UI/UX audit status](./active/ui-ux/SUMMARY.md)
- [Закрытый аудит (2026-06-23)](./archive/2026-06-23-global-audit-closure/SUMMARY.md) — sprints A–F
- [Post-fix closure](./archive/2026-06-23-post-fix/SUMMARY.md)
- [Базовый аудит (commit `62a1287`)](./archive/2026-05-28-baseline/SUMMARY.md)
