# API-ключи и настройки

Пользователь должен **менять ключи в приложении** без пересборки. Ключ OpenRouter — основной для AI-диалога.

## Типы ключей (план)

| ID | Назначение | Где используется |
|----|------------|------------------|
| `openrouter` | Чат / streaming | `features/ai-chat` → OpenRouter |
| `azure-speech` | STT + TTS (prod) | main или shared API |
| *(при необходимости)* | Другие провайдеры | по мере добавления |

## Приоритет значения

1. **Пользовательские** — сохранены в Settings (secure storage в main)
2. **`.env`** — только dev/bootstrap при первом запуске (опционально подставить в форму, не перетирать сохранённый ключ)

## UX (страница `pages/settings`)

- Поля ввода с маской (`sk-…••••••••`)
- Кнопки: **Сохранить**, **Проверить** (лёгкий запрос к API), **Очистить**
- Отдельные секции: OpenRouter, Azure Speech (когда появится)
- Не показывать полный ключ после сохранения — только «задан / не задан» + замена
- Валидация перед первым диалогом: если нет `openrouter` ключа — блокировать чат с ссылкой на настройки

## FSD

```
features/manage-api-keys/   # форма, save, validate
entities/api-credential/    # типы, статус «configured»
pages/settings/             # собирает feature + прочие настройки
electron/main/secrets/      # чтение/запись (вне FSD)
```

## Хранение (Electron main) — **только keytar**

- Пакет: [`keytar`](https://github.com/atom/node-keytar) — Windows Credential Manager / macOS Keychain / libsecret
- Сервис: `Lingo`, аккаунт: `lingo.openrouter` (и др. по `SecretProviderId`)
- Реализация: `electron/main/secrets.ts` — **без** `safeStorage`, **без** `secrets.json`
- После первого запуска старый `secrets.json` (если был) мигрируется в keytar и удаляется
- Renderer: IPC `lingo:secrets:*` — полный ключ не возвращается (только `isSet`, masked)
- `postinstall`: `electron-rebuild -f -w keytar`

## IPC (контракт, план)

```typescript
type SecretProviderId = 'openrouter' | 'azure-speech';

interface SecretStatus {
  provider: SecretProviderId;
  isSet: boolean;
  masked?: string; // например "sk-or-…xxxx"
}

// setKey — только main, renderer передаёт значение один раз при сохранении
// getStatus — без полного секрета
// validateOpenRouter — HEAD или минимальный chat completion
```

## .env (только разработка)

См. `docs/env.example.md`. Production-путь — настройки в UI, не обязательный `.env` у конечного пользователя.

## Безопасность

- Не коммитить ключи
- Не отправлять ключ в analytics / error reports
- При экспорте настроек — исключать секреты или шифровать явно
