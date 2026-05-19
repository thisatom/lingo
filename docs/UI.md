# UI / UX — shadcn/ui

Все интерфейсы Lingo строятся на **[shadcn/ui](https://ui.shadcn.com/)** поверх **Tailwind CSS** и **Radix UI**.

## Принципы

- Компоненты shadcn **копируются в репозиторий** (не opaque npm UI-kit) — путь: `src/shared/ui/`
- Стилизация: **Tailwind** + утилита `cn()` (`clsx` + `tailwind-merge`) в `src/shared/lib/utils.ts`
- Новый примитив — через CLI shadcn (`npx shadcn@latest add <component>`) в `shared/ui`, не в `features/`
- Фичи и страницы **импортируют** из `@/shared/ui/*`, при необходимости оборачивают в локальный `ui/` слайса

## FSD

| Что | Где |
|-----|-----|
| Button, Input, Dialog, Card, … | `shared/ui/` |
| `cn()`, общие classNames | `shared/lib/utils.ts` |
| Композиция под сценарий | `features/*/ui`, `widgets/*/ui` |
| Глобальные стили, CSS variables темы | `app/styles/` |

### Импорты

```typescript
// ✅ pages/settings/ui/SettingsPage.tsx
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

// ❌ features/ai-chat/ui/Chat.tsx
// не копировать Button.tsx внутрь feature — добавить в shared/ui
```

### Расширение

- Мелкая вариация — `className` + `cn()` на shadcn-компоненте
- Повторяемый паттерн (например «поле API-ключа») — `shared/ui/` или `features/manage-api-keys/ui/`, собранный из shadcn-примитивов

## Тема

- CSS variables shadcn (`--background`, `--primary`, …) в `app/styles/globals.css`
- Поддержка `dark` по желанию — через `class` на `html` / провайдер в `app/`
- Единая тема для всего приложения; не плодить локальные палитры в слайсах

## Рекомендуемые компоненты для Lingo (план)

| Экран / сценарий | shadcn |
|------------------|--------|
| Настройки, API key | `Input`, `Label`, `Button`, `Card`, `Separator` |
| Диалог / чат | `ScrollArea`, `Card`, `Avatar`, `Badge` |
| Запись | `Button` (variant), прогресс — `Progress` |
| Ошибки | `Alert`, `Sonner` (toast) |
| Модалки | `Dialog`, `Sheet` |

Добавлять по мере реализации, не все сразу.

## Electron

- shadcn только в **renderer** (`src/`), не в `electron/main`
- Titlebar — `@incanta/custom-electron-titlebar` (main); контент окна — shadcn + Tailwind

## Scaffold (при реализации)

1. Vite + React + TypeScript + Tailwind
2. `npx shadcn@latest init` — `components.json`, alias `@/shared/ui`
3. Первые компоненты: `button`, `input`, `label`, `card`

См. [PLANNED_DEPENDENCIES.md](./PLANNED_DEPENDENCIES.md).

## Ссылки

- [shadcn/ui docs](https://ui.shadcn.com/docs)
- [FSD.md](./FSD.md)
