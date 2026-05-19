import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'

/** Rounded hover rows in sidebar / composer menus. */
export const sidebarMenuRadiusClass = APP_RADIUS_8_CLASS

/** Hover for composer input controls (matches context button). */
export const composerInputHoverClass =
  'rounded-full hover:bg-[#303030] hover:text-foreground data-[state=open]:bg-[#303030] data-[state=open]:text-foreground'

export const sidebarMenuSurfaceClass =
  'border-border/60 bg-[#181818] text-popover-foreground shadow-lg'

export const sidebarMenuItemClass = cn(
  'min-h-7 cursor-pointer gap-2 px-2.5 py-1 text-xs leading-normal',
  sidebarMenuRadiusClass,
  'focus:bg-[#252525] data-[highlighted]:bg-[#252525]'
)

export const sidebarMenuSubTriggerClass = cn(sidebarMenuItemClass, 'pr-8')

export const sidebarMenuLabelClass =
  'px-2 py-1 text-xs font-normal leading-normal text-muted-foreground'

/** Ghost icon button — sidebar filter trigger, composer toolbar icons. */
export const sidebarMenuIconButtonClass = cn(
  'size-7 shrink-0 cursor-pointer text-muted-foreground',
  composerInputHoverClass
)

/** Text picker trigger — composer Agent / model selects. */
export const sidebarMenuPickerTriggerClass = cn(
  'relative inline-flex h-7 min-h-7 w-fit max-w-[9rem] min-w-0 shrink-0 cursor-pointer items-center',
  'rounded-full py-0 pr-8 pl-2.5 text-[13px] leading-normal text-muted-foreground outline-none',
  composerInputHoverClass,
  'focus-visible:bg-[#303030]',
  'disabled:pointer-events-none disabled:opacity-50'
)
