# Планируемые зависимости (не установлены)

См. также [STACK.md](./STACK.md).

## Обязательно при scaffold

```bash
npm i @incanta/custom-electron-titlebar
```

## AI (OpenRouter + один из SDK)

```bash
# Вариант A (рекомендуется)
npm i ai @ai-sdk/openai

# Вариант B
npm i openai
```

`baseURL`: `https://openrouter.ai/api/v1` — см. `docs/OPENROUTER.md`.

## Secure storage (ключи в main)

```bash
# при scaffold — electron safeStorage встроен; опционально:
# npm i keytar
```

Позже (только при сложных сценариях): `@langchain/langgraph`.

## TTS

```bash
# Dev — main process (уточнить пакет при установке)
npm i edge-tts-universal
# или: node-edge-tts

# Prod
# Azure Speech SDK — при релизе
```

## UI (shadcn)

```bash
# после Vite + React + Tailwind
npx shadcn@latest init
npx shadcn@latest add button input label card
```

- Компоненты в `src/shared/ui/` (alias `@/shared/ui` в `components.json`)
- `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*` — подтянет CLI

См. `docs/UI.md`.

## Прочее (пример)

- `electron`, `react`, `react-dom`
- `typescript`, `vite`, плагин electron

Titlebar — **обязательный** выбор для окна Lingo, не заменять на самописный frame без причины.
