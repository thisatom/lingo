import { cn } from '@/shared/lib/utils'
import { menuContentPaddingClass, sidebarMenuRadiusClass } from '@/shared/lib/sidebar-filter-menu-styles'

/** Softer scrim so the frosted panel reads clearly over the app. */
export const commandPaletteOverlayClass = 'bg-[var(--command-palette-overlay)]'

export const commandPaletteDialogContentClass = cn(
  'lingo-command-palette-surface max-w-[calc(100%-2rem)] overflow-hidden rounded-[14px] border p-0 shadow-[0_16px_70px_rgb(0_0_0/0.45)] sm:max-w-[640px]',
  '!border-[var(--command-palette-border)] !bg-[var(--command-palette-surface)]'
)

export const commandPaletteRootClass = cn(
  'border-0 bg-transparent text-popover-foreground shadow-none dark:bg-transparent'
)

export const commandPaletteInputWrapperClass = cn(
  'flex h-[42px] min-h-[42px] items-center gap-2 border-b border-[var(--command-palette-separator)] px-4'
)

export const commandPaletteInputClass = cn(
  'flex h-[42px] min-h-[42px] w-full bg-transparent py-0 text-sm leading-none text-foreground outline-hidden',
  'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
)

export const commandPaletteListClass = 'max-h-[min(60vh,28rem)]'

export const commandPaletteSeparatorClass = 'my-1 h-px bg-[var(--command-palette-separator)]'

export const commandPaletteGroupClass = cn(
  'overflow-hidden text-foreground',
  menuContentPaddingClass,
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:leading-normal [&_[cmdk-group-heading]]:text-muted-foreground'
)

export const commandPaletteItemClass = cn(
  'relative flex h-[30px] min-h-[30px] cursor-pointer items-center gap-2 py-0 pl-2 pr-[3px] text-sm leading-none text-foreground outline-hidden select-none',
  sidebarMenuRadiusClass,
  'data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50',
  '[&[aria-selected=true]]:bg-[var(--command-palette-item-hover)] [&[aria-selected=true]]:text-popover-foreground',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 [&_svg:not([class*="text-"])]:text-muted-foreground'
)

export const commandPaletteEmptyClass = 'py-8 text-center text-sm text-muted-foreground'
