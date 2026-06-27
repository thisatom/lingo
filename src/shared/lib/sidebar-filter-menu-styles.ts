import { overlayBorderClass } from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'

/** Rounded hover rows in sidebar / composer menus. */
export const sidebarMenuRadiusClass = 'rounded-lg'

/** Hover for composer input controls (matches context button). */
export const composerInputHoverClass =
  'rounded-full hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground'

export const menuSurfaceBorderClass = overlayBorderClass

export const sidebarMenuSurfaceClass = cn(
  overlayBorderClass,
  'rounded-lg bg-popover text-popover-foreground shadow-md shadow-black/10 dark:shadow-black/35'
)

/** Menu panel inset (dropdown / select / context / command list). */
export const menuContentPaddingClass = 'p-[3px]'

/** Interactive row padding — 3px on all sides. */
export const menuItemPaddingClass = 'py-[3px] pr-[3px] pl-[8px]'

/** Checkbox / radio rows: left inset for indicator + text aligned with select rows. */
export const menuIndicatorItemPaddingClass = 'py-[3px] pr-[3px] pl-[28px]'

/** Submenu trigger: 3px + chevron on the right. */
export const menuSubTriggerPaddingClass = 'py-[3px] pl-[8px] pr-[24px]'

/** Matches `menuItemPaddingClass` pl-8 — indicator sits in the same column as select checkmarks. */
export const menuIndicatorInsetClass = 'left-[8px]'

export const menuTrailingInsetClass = 'right-[3px]'

/** Row padding when a trailing icon (check, chevron) sits on the right. */
export const menuItemTrailingIconPaddingClass = 'py-[3px] pr-[24px] pl-[8px]'

/** Shared absolute slot for leading check / radio indicators. */
export const menuLeadingIndicatorClass = cn(
  'pointer-events-none absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center',
  menuIndicatorInsetClass
)

/** Shared absolute slot for trailing check / chevron indicators. */
export const menuTrailingIndicatorClass = cn(
  'pointer-events-none absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center',
  menuTrailingInsetClass
)

/** Row highlight — dropdown, command palette, context menus. */
export const menuItemHighlightClass =
  'focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:focus:bg-transparent data-[disabled]:data-[highlighted]:bg-transparent data-[disabled]:data-[highlighted]:text-inherit'

export const menuSeparatorClass = 'my-[3px] h-px bg-separator'

export const menuLabelClass = cn(
  menuItemPaddingClass,
  'text-xs font-normal leading-normal text-muted-foreground'
)

export const sidebarMenuItemClass = cn(
  'min-h-7 cursor-pointer gap-2 text-xs leading-normal',
  menuItemPaddingClass,
  sidebarMenuRadiusClass,
  menuItemHighlightClass
)

export const menuCheckboxItemClass = cn(
  'relative flex min-h-7 cursor-default items-center gap-2 text-sm leading-normal outline-hidden select-none',
  sidebarMenuRadiusClass,
  menuIndicatorItemPaddingClass,
  menuItemHighlightClass
)

/** Tight stack for radio options inside a dropdown. */
export const menuCheckboxRadioGroupClass = 'flex flex-col gap-px'

/**
 * Panel padding + gap after checkbox/radio block before plain items, labels, or submenus
 * (select-style dropdown rows).
 */
export const menuContentSpacingClass = cn(
  menuContentPaddingClass,
  '[&_[data-slot=dropdown-menu-radio-group]+[data-slot=dropdown-menu-item]]:mt-1',
  '[&_[data-slot=dropdown-menu-radio-group]+[data-slot=dropdown-menu-sub]]:mt-1',
  '[&_[data-slot=dropdown-menu-radio-group]+[data-slot=dropdown-menu-label]]:mt-1',
  '[&_[data-slot=dropdown-menu-radio-group]+[data-slot=dropdown-menu-separator]]:mt-0.5',
  '[&_[data-slot=dropdown-menu-checkbox-item]+[data-slot=dropdown-menu-item]]:mt-1',
  '[&_[data-slot=dropdown-menu-checkbox-item]+[data-slot=dropdown-menu-sub]]:mt-1',
  '[&_[data-slot=dropdown-menu-checkbox-item]+[data-slot=dropdown-menu-label]]:mt-1',
  '[&_[data-slot=dropdown-menu-checkbox-item]+[data-slot=dropdown-menu-separator]]:mt-0.5'
)

export const menuCommandItemClass = cn(
  'relative flex min-h-7 cursor-pointer items-center gap-2 rounded-sm text-sm leading-normal text-foreground outline-hidden select-none',
  menuItemPaddingClass,
  sidebarMenuRadiusClass,
  menuItemHighlightClass,
  'data-[selected=true]:bg-menu-hover data-[selected=true]:text-popover-foreground'
)

export const sidebarMenuSubTriggerClass = cn(
  'min-h-7 w-full cursor-pointer gap-2 text-xs leading-normal',
  menuSubTriggerPaddingClass,
  sidebarMenuRadiusClass,
  menuItemHighlightClass
)

export const sidebarMenuLabelClass = menuLabelClass

/** Ghost icon button — sidebar filter trigger, composer toolbar icons. */
export const sidebarMenuIconButtonClass = cn(
  'size-7 shrink-0 cursor-pointer text-muted-foreground',
  composerInputHoverClass
)

/** Agent mode picker — fits "Agent Speech" + optional Auto suffix. */
export const composerAgentPickerTriggerClass = cn(
  'inline-flex h-7 min-h-7 w-fit max-w-none min-w-0 shrink-0 cursor-pointer items-center gap-1',
  'rounded-full py-0 pl-2.5 pr-2 text-[13px] leading-none text-muted-foreground outline-none',
  composerInputHoverClass,
  'focus-visible:bg-accent',
  'disabled:pointer-events-none disabled:opacity-50'
)

export const sidebarMenuPickerTriggerClass = cn(
  'inline-flex h-7 min-h-7 w-fit max-w-[9rem] min-w-0 shrink-0 cursor-pointer items-center gap-1',
  'rounded-full py-0 pl-2.5 pr-2 text-[13px] leading-none text-muted-foreground outline-none',
  composerInputHoverClass,
  'focus-visible:bg-accent',
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
