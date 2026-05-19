import { cn } from '@/shared/lib/utils'

/** Matches sidebar filter / top icon buttons (size-7 ghost). */
export const composerToolbarIconClass =
  'size-7 shrink-0 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground'

/** Compact select trigger aligned with composer toolbar icon buttons. */
export const composerSelectTriggerClass = cn(
  composerToolbarIconClass,
  'h-7 w-auto max-w-[6.5rem] cursor-pointer gap-0.5 border-0 bg-transparent px-1.5 text-[11px] leading-none shadow-none',
  'hover:bg-muted/50 focus-visible:ring-1',
  '[&_svg]:ml-0 [&_svg]:size-3 [&_svg]:opacity-60'
)

export const composerSelectContentClass =
  'min-w-[11rem] border-border/60 bg-[#181818] p-0.5 text-popover-foreground'

export const composerSelectItemClass =
  'h-7 cursor-pointer py-0 pr-8 pl-1.5 text-xs [&_[data-slot=select-item-indicator]]:right-2'
