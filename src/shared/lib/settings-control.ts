import { cn } from '@/shared/lib/utils'

/** Shared compact control styles for settings pages. */

export const settingsInputClass = cn(
  'h-7 rounded-md border px-2.5 py-0 text-sm shadow-none transition-colors outline-none',
  'border-border bg-input hover:border-ring/60 focus-visible:border-ring focus-visible:ring-0',
  'dark:h-6 dark:border-[#373737] dark:bg-[#282828] dark:hover:border-[#444444]',
  'dark:focus-visible:border-[#4e4e4e] dark:focus-visible:bg-[#282828]'
)

/** Select / popover / command panel in settings — dark: #181818, border #303030. */
export const settingsMenuSurfaceClass = cn(
  'rounded-md border bg-popover text-popover-foreground shadow-md',
  'dark:border-[#303030] dark:bg-[#181818]'
)

export const settingsSelectTriggerClass = cn(
  '!h-6 rounded-md border px-2.5 py-0 text-sm shadow-none transition-colors outline-none',
  'border-border bg-input hover:border-ring/60 focus-visible:ring-0',
  'dark:border-[#303030] dark:bg-[#181818] dark:hover:border-[#444444]',
  'dark:focus:border-[#444444] dark:focus:bg-[#181818]',
  'dark:focus-visible:border-[#444444] dark:focus-visible:bg-[#181818]',
  'dark:data-[state=open]:border-[#444444] dark:data-[state=open]:bg-[#181818]'
)

export const settingsSelectContentClass = settingsMenuSurfaceClass

/** Row hover / selection in settings lists — dark: #252525. */
export const settingsMenuItemHighlightClass = cn(
  'data-[highlighted]:bg-menu-hover data-[selected=true]:bg-menu-hover focus:bg-menu-hover',
  'dark:data-[highlighted]:!bg-[#252525] dark:data-[selected=true]:!bg-[#252525]',
  'dark:focus:!bg-[#252525] dark:aria-selected:!bg-[#252525]'
)

export const settingsSelectItemClass = cn(
  '!h-6 !min-h-6 rounded-sm py-0 text-sm leading-none',
  settingsMenuItemHighlightClass
)

export const settingsCommandClass = cn(settingsMenuSurfaceClass, 'border-0 shadow-none overflow-hidden')

export const settingsButtonSize = 'compact' as const

export const settingsPopoverTriggerClass = cn(
  'h-7 w-full justify-between rounded-md border px-2.5 text-sm font-normal shadow-none',
  'border-border bg-input hover:bg-input',
  'dark:border-[#303030] dark:bg-[#181818] dark:hover:border-[#444444] dark:hover:bg-[#181818]',
  'dark:data-[state=open]:border-[#444444] dark:data-[state=open]:bg-[#181818]'
)

export const settingsCommandItemClass = cn(
  '!h-8 !min-h-8 rounded-sm py-0 text-sm leading-none',
  settingsMenuItemHighlightClass,
  'dark:data-[selected=true]:!bg-[#252525] dark:data-[selected=true]:!text-popover-foreground'
)

export const settingsCommandInputWrapperClass = cn(
  'border-b px-2',
  'border-border dark:border-[#303030]'
)

export const settingsCommandInputClass =
  'h-8 border-0 bg-transparent text-sm text-foreground shadow-none focus-visible:ring-0'

export const settingsCommandListClass = 'max-h-[min(280px,50vh)]'
