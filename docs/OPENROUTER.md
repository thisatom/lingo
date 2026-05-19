# OpenRouter — AI-провайдер Lingo

Все запросы к языковой модели идут через **[OpenRouter](https://openrouter.ai/)** (OpenAI-совместимый API).

## Подключение

| Параметр | Значение |
|----------|----------|
| Base URL | `https://openrouter.ai/api/v1` |
| Авторизация | `Authorization: Bearer <OPENROUTER_API_KEY>` |
| Формат модели | `provider/model`, например `openai/gpt-4o-mini`, `anthropic/claude-3.5-sonnet` |

Рекомендуемые заголовки (рейтинги на OpenRouter):

- `HTTP-Referer` — URL или идентификатор приложения
- `X-Title` — `Lingo`

## SDK

OpenRouter совместим с **OpenAI API**. В Lingo:

- **Vercel AI SDK:** `createOpenAI` из `@ai-sdk/openai` с `baseURL: 'https://openrouter.ai/api/v1'` и ключом из хранилища
- **OpenAI SDK:** `new OpenAI({ baseURL, apiKey })` — тот же принцип

Ключ и `baseURL` **не хардкодить** в renderer — брать из [API_KEYS.md](./API_KEYS.md).

## Выбор модели

- Модель по умолчанию — в настройках (строка OpenRouter id) или `LINGO_OPENROUTER_MODEL` в `.env` для dev
- Список моделей: OpenRouter API `/models` (опционально в UI настроек позже)
- Для разговорной практики старт: недорогая chat-модель (`openai/gpt-4o-mini` и аналоги)

## FSD

| Что | Где |
|-----|-----|
| HTTP-клиент / stream | `features/ai-chat/api` |
| Текущая модель, ключ (мета) | `entities/api-credential` |
| Константы base URL | `shared/config/openrouter.ts` |

## Ошибки

- `401` — неверный или пустой ключ → экран настроек
- `402` / insufficient credits — сообщение пользователю
- Rate limit — retry с backoff в `features/ai-chat`

## Ссылки

- [OpenRouter docs](https://openrouter.ai/docs)
- [API keys](./API_KEYS.md)
- [STACK.md](./STACK.md)
