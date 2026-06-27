import { menuItemPaddingClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'

/** Shared compact control styles for settings pages. */

export const settingsInputClass = cn(
  'h-7 rounded-lg border px-2.5 py-0 text-sm shadow-none transition-colors outline-none',
  'border-input bg-input hover:bg-accent hover:text-accent-foreground hover:border-input focus-visible:border-ring focus-visible:ring-0',
  'dark:h-6 dark:border-input dark:bg-secondary dark:hover:bg-accent dark:hover:text-accent-foreground',
  'dark:focus-visible:border-ring dark:focus-visible:bg-secondary'
)

/** Select / popover / command panel in settings. */
export const settingsMenuSurfaceClass = cn(
  'rounded-lg border border-overlay-border bg-popover text-popover-foreground shadow-md shadow-black/10 dark:shadow-black/35'
)

export const settingsSelectTriggerClass = cn(
  'relative cursor-pointer',
  '!h-6 rounded-lg border py-0 pl-2 pr-8 text-xs leading-tight shadow-none transition-colors outline-none',
  'border-input bg-input text-foreground hover:bg-accent hover:text-accent-foreground hover:border-input focus-visible:ring-0',
  'dark:hover:bg-accent dark:hover:text-accent-foreground',
  'dark:focus:border-ring dark:focus:bg-popover',
  'dark:focus-visible:border-ring dark:focus-visible:bg-popover',
  'dark:data-[state=open]:border-ring dark:data-[state=open]:bg-popover'
)

export const settingsSelectContentClass = settingsMenuSurfaceClass

/** Row hover / selection in settings lists. */
export const settingsMenuItemHighlightClass = cn(
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
)

export const settingsSelectItemClass = cn(
  'cursor-pointer',
  '!h-6 !min-h-6 rounded-lg text-xs leading-none',
  menuItemPaddingClass,
  settingsMenuItemHighlightClass
)

export const settingsCommandClass = cn(settingsMenuSurfaceClass, 'border-0 shadow-none overflow-hidden')

export const settingsButtonSize = 'compact' as const

export const settingsPopoverTriggerClass = cn(
  'cursor-pointer',
  'h-7 w-full justify-between rounded-lg border px-2.5 text-sm font-normal shadow-none',
  'border-input bg-input hover:bg-accent hover:text-accent-foreground hover:border-input',
  'dark:hover:bg-accent dark:data-[state=open]:border-ring dark:data-[state=open]:bg-popover'
)

export const settingsCommandItemClass = cn(
  'cursor-pointer',
  '!h-6 !min-h-6 rounded-lg text-xs leading-none',
  menuItemPaddingClass,
  settingsMenuItemHighlightClass,
  'dark:data-[selected=true]:!bg-menu-hover dark:data-[selected=true]:!text-popover-foreground'
)

export const settingsCommandInputWrapperClass = cn(
  'h-[30px] min-h-[30px]',
  'border-b px-2',
  'border-menu-border'
)

export const settingsCommandInputClass =
  'h-[30px] min-h-[30px] border-0 bg-transparent text-sm leading-none text-foreground shadow-none focus-visible:ring-0'

export const settingsCommandListClass = 'max-h-[min(280px,50vh)]'

/** Fixed width for settings row text inputs. */
export const settingsRowInputClass = cn(settingsInputClass, 'w-full min-w-0 sm:w-[220px]')

/** Fixed width for settings row selects (Appearance, General, …). */
export const settingsRowSelectTriggerClass = cn(
  settingsSelectTriggerClass,
  'w-full max-w-full min-w-0 sm:w-[220px] sm:max-w-none'
)

/** Wider settings row selects (devices, agent). */
export const settingsRowSelectTriggerWideClass = cn(
  settingsSelectTriggerClass,
  'w-full max-w-full min-w-0 sm:w-[280px] sm:max-w-none'
)
