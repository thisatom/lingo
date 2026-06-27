# UI / UX — shadcn/ui (TrustRouter-aligned)

Все интерфейсы Lingo строятся на **[shadcn/ui](https://ui.shadcn.com/)** поверх **Tailwind CSS v4** и **Radix UI**.

Дизайн-система выровнена под **TrustRouter** (`/home/ex0/gi/trustrouter/frontend/src/app/globals.css`): тёмные слои фона, синий accent, ring-elevation вместо тяжёлых border.

## Принципы

- Компоненты shadcn **копируются в репозиторий** — путь: `src/shared/ui/`
- Стилизация: **Tailwind** + `cn()` (`clsx` + `tailwind-merge`) в `src/shared/lib/utils.ts`
- **Semantic tokens only** — не добавлять `#hex` в TSX; палитра в `src/app/styles/globals.css`
- Общие паттерны поверхностей: `src/shared/lib/design-surface.ts`
- Новый примитив — через CLI shadcn (`npx shadcn@latest add <component>`) в `shared/ui`

## Палитра TrustRouter → Lingo

| Token | Dark | Role |
|-------|------|------|
| `--tr-bg-main` | `#141414` | Page background |
| `--tr-bg-2` | `#181818` | Sidebar, popover |
| `--tr-bg-item` | `#1c1c1c` | Cards, composer shell |
| `--tr-bg-3` | `#212121` | Secondary, assistant bubbles |
| `--tr-accent` | `#5b8def` | Primary buttons, links, focus ring |
| `--tr-hover` | `#252525` | Hover rows |
| `--overlay-border` | `#303030` | Menu / dropdown edges |
| `--tr-switch-on` | `#3fa266` | Switch checked |

Lingo-specific: `--chat-composer`, `--chat-user`, `--chat-assistant`, `--thinking-foreground`, markdown code vars.

## Elevation (поверхности)

Один край `border border-overlay-border` + тень — **без** `ring` поверх `border` и **без** `backdrop-blur`.

```typescript
import { elevatedSurfaceClass, modalSurfaceClass } from '@/shared/lib/design-surface'
```

Диалоги: overlay `bg-black/45` (без blur), footer `border-separator bg-muted/50`.

## FSD

| Что | Где |
|-----|-----|
| Button, Input, Dialog, Card, … | `shared/ui/` |
| `cn()`, design surfaces | `shared/lib/` |
| Композиция под сценарий | `features/*/ui`, `widgets/*/ui` |
| Глобальные стили, CSS variables | `app/styles/` |

## Исключения

- **Градиент над input чата** — `custom-scroll-area.tsx`, `bg-gradient-to-t from-background` — не менять при редизайне
- Titlebar — `@incanta/custom-electron-titlebar` (main); цвета через `--sidebar` в globals

## Electron

- shadcn только в **renderer** (`src/`)
- Titlebar — main/preload; контент окна — shadcn + Tailwind

## Ссылки

- [shadcn/ui docs](https://ui.shadcn.com/docs)
- [FSD.md](./FSD.md)
- TrustRouter reference: `trustrouter/frontend/src/app/globals.css`
