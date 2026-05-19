# Feature-Sliced Design в Lingo

## Дерево слоёв (план)

```
src/
├── app/                    # App, providers, globals.css (shadcn theme)
├── pages/
│   ├── main/               # Главный экран диалога
│   └── settings/           # OpenRouter key, модель, языки, голос
├── widgets/
│   ├── conversation-panel/
│   └── recording-indicator/
├── features/
│   ├── voice-capture/
│   ├── speech-to-text/
│   ├── ai-chat/              # OpenRouter streaming
│   ├── manage-api-keys/      # форма смены ключей
│   ├── text-to-speech/
│   └── language-select/
├── entities/
│   ├── message/
│   ├── conversation/
│   ├── api-credential/       # isSet, provider id (без секрета)
│   └── language/
└── shared/
    ├── ui/                 # shadcn/ui (button, input, card, …)
    ├── lib/                # utils.ts (cn), helpers
    ├── api/
    │   └── tts/          # TtsProvider: edge-tts (dev) / Azure (prod)
    ├── config/
    ├── lib/
    └── types/
```

## Сегменты слайса

| Сегмент | Содержимое |
|---------|------------|
| `ui/` | React-компоненты |
| `model/` | stores, hooks, state machines |
| `api/` | запросы, адаптеры провайдеров |
| `lib/` | чистые функции слайса |
| `index.ts` | public API |

## Зависимости

```
app → pages → widgets → features → entities → shared
```

Пересечение слайсов одного слоя — через `shared` или события/контракты, не прямые импорты «соседей».

## Electron vs FSD

| Код | Расположение |
|-----|--------------|
| React UI | `src/**` |
| Main / preload | `electron/**` (вне FSD) |
| Общие типы IPC | `src/shared/types/` + дубль типов в preload при необходимости |
