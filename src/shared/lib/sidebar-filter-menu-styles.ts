import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'

import { cn } from '@/shared/lib/utils'



/** Rounded hover rows in sidebar / composer menus. */

export const sidebarMenuRadiusClass = APP_RADIUS_8_CLASS



/** Hover for composer input controls (matches context button). */

export const composerInputHoverClass =

  'rounded-full hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground dark:hover:bg-[#303030] dark:hover:text-foreground dark:data-[state=open]:bg-[#303030] dark:data-[state=open]:text-foreground'



export const menuSurfaceBorderClass = 'border-menu-border'

export const sidebarMenuSurfaceClass = cn(
  menuSurfaceBorderClass,
  'bg-popover text-popover-foreground shadow-lg dark:bg-[#181818]'
)

/** Row highlight — dropdown, command palette, context menus. */
export const menuItemHighlightClass =
  'focus:bg-menu-hover focus:text-popover-foreground data-[highlighted]:bg-menu-hover data-[highlighted]:text-popover-foreground dark:focus:bg-[#252525] dark:data-[highlighted]:bg-[#252525]'



export const sidebarMenuItemClass = cn(

  'min-h-7 cursor-pointer gap-2 px-2 py-0.5 text-xs leading-normal',

  sidebarMenuRadiusClass,

  menuItemHighlightClass

)



export const sidebarMenuSubTriggerClass = cn(sidebarMenuItemClass, 'pr-8')



export const sidebarMenuLabelClass =

  'px-2 py-0.5 text-xs font-normal leading-normal text-muted-foreground'



/** Ghost icon button — sidebar filter trigger, composer toolbar icons. */

export const sidebarMenuIconButtonClass = cn(

  'size-7 shrink-0 cursor-pointer text-muted-foreground',

  composerInputHoverClass

)



/** Text picker trigger — composer Agent / model selects. */

/** Agent mode picker — fits "Agent Speech" + optional Auto suffix. */
export const composerAgentPickerTriggerClass = cn(
  'inline-flex h-7 min-h-7 w-fit max-w-none min-w-0 shrink-0 cursor-pointer items-center gap-1',
  'rounded-full py-0 pl-2.5 pr-2 text-[13px] leading-none text-muted-foreground outline-none',
  composerInputHoverClass,
  'focus-visible:bg-accent dark:focus-visible:bg-[#303030]',
  'disabled:pointer-events-none disabled:opacity-50'
)

export const sidebarMenuPickerTriggerClass = cn(

  'inline-flex h-7 min-h-7 w-fit max-w-[9rem] min-w-0 shrink-0 cursor-pointer items-center gap-1',

  'rounded-full py-0 pl-2.5 pr-2 text-[13px] leading-none text-muted-foreground outline-none',

  composerInputHoverClass,

  'focus-visible:bg-accent dark:focus-visible:bg-[#303030]',

  'disabled:pointer-events-none disabled:opacity-50'

)

export const sidebarMenuPickerDotClass =
  'inline-block size-[3px] shrink-0 self-center rounded-full bg-muted-foreground/60'

export const sidebarMenuPickerChevronClass =
  'size-4 shrink-0 translate-y-px text-muted-foreground opacity-70'



export const sidebarFilterTriggerClass = cn(

  'h-6 gap-1 rounded-full border border-border/80 bg-transparent px-2 text-xs text-muted-foreground shadow-none',

  composerInputHoverClass

)



export const sidebarFilterMenuContentClass = sidebarMenuSurfaceClass



export const sidebarFilterMenuItemClass = sidebarMenuItemClass



export const composerToolbarIconClass = 'size-3.5 shrink-0 opacity-80'



export const sidebarFilterIconButtonClass = sidebarMenuIconButtonClass

