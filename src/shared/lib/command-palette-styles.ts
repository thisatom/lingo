import { cn } from '@/shared/lib/utils'
import { menuContentPaddingClass, sidebarMenuRadiusClass } from '@/shared/lib/sidebar-filter-menu-styles'

/** Scrim behind the command palette — no backdrop blur. */
export const commandPaletteOverlayClass = cn(
  'lingo-command-palette-overlay bg-[var(--command-palette-overlay)]'
)

export const commandPaletteDialogContentClass = cn(
  'lingo-command-palette-surface relative !flex max-h-[min(80vh,32rem)] min-h-[320px] flex-col gap-0',
  'max-w-[calc(100%-2rem)] overflow-hidden rounded-[16px] border p-0',
  'shadow-[var(--command-palette-shadow)] sm:max-w-[640px]',
  '!border-[var(--command-palette-border)] !bg-[var(--command-palette-surface)]'
)

export const commandPaletteRootClass = cn(
  'flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent text-popover-foreground shadow-none dark:bg-transparent'
)

export const commandPaletteInputWrapperClass = cn(
  'flex h-[44px] min-h-[44px] shrink-0 items-center gap-2.5',
  'border-b border-[var(--command-palette-separator)] px-4'
)

export const commandPaletteInputClass = cn(
  'flex h-full min-h-0 w-full bg-transparent py-0 text-sm leading-none text-foreground outline-hidden',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
)

export const commandPaletteListClass = cn(
  'relative flex-1 overflow-hidden',
  'min-h-[12rem] max-h-[min(calc(80vh-5.5rem),26rem)]'
)

export const commandPaletteSeparatorClass = 'my-1 h-px bg-[var(--command-palette-separator)]'

export const commandPaletteGroupClass = cn(
  'overflow-hidden text-foreground',
  menuContentPaddingClass,
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:leading-normal [&_[cmdk-group-heading]]:text-muted-foreground/80'
)

export const commandPaletteItemClass = cn(
  'relative flex min-h-[34px] cursor-pointer items-center gap-2.5 py-1 pl-2.5 pr-2 text-sm leading-none text-foreground outline-hidden select-none',
  sidebarMenuRadiusClass,
  'data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50',
  'hover:bg-[var(--command-palette-item-hover)] hover:text-popover-foreground',
  'data-[selected=true]:bg-[var(--command-palette-item-hover)] data-[selected=true]:text-popover-foreground',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground'
)

/** Fixed icon slot — aligns codicons with single-line labels. */
export const commandPaletteItemIconClass = cn(
  'flex size-4 shrink-0 items-center justify-center self-center text-muted-foreground',
  '[&_.codicon]:!translate-y-0 [&_.codicon]:size-4 [&_.codicon]:shrink-0'
)

export const commandPaletteEmptyClass = 'py-10 text-center text-sm text-muted-foreground'

export const commandPaletteFooterClass = cn(
  'relative z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1',
  'border-t border-[var(--command-palette-separator)] bg-[var(--command-palette-surface)]',
  'px-4 py-2 text-[11px] text-muted-foreground'
)
