import { cn } from '@/shared/lib/utils'

/** Matches sidebar filter / top icon buttons (size-7 ghost). */
export const composerToolbarIconClass = cn(
  'size-7 shrink-0 rounded-full text-muted-foreground',
  'hover:bg-[#303030] hover:text-foreground'
)

/** Compact select trigger aligned with composer toolbar. */
export const composerSelectTriggerClass = cn(
  'flex !h-7 w-auto max-w-[9rem] min-w-0 shrink-0 cursor-pointer items-center !justify-start gap-1.5 py-0',
  'rounded-full border-0 bg-transparent px-2 text-[13px] font-normal leading-none text-muted-foreground shadow-none',
  'hover:bg-[#303030] hover:text-foreground',
  'focus-visible:ring-1 focus-visible:ring-ring/50',
  '[&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:leading-none',
  '[&_[data-slot=select-value]]:line-clamp-1 [&_[data-slot=select-value]]:min-w-0',
  '[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:self-center [&_svg]:opacity-70'
)

export const composerSelectContentClass =
  'min-w-[11rem] border-border/60 bg-[#181818] p-0.5 text-popover-foreground'

export const composerSelectItemClass =
  'h-8 cursor-pointer py-0 pr-8 pl-2 text-[13px] [&_[data-slot=select-item-indicator]]:right-2'

/** Model picker on the footer row — wider than toolbar selects. */
export const composerModelSelectTriggerClass = cn(
  composerSelectTriggerClass,
  'max-w-[min(100%,14rem)]'
)

export const CHAT_MODE_LABELS = {
  text: 'Agent',
  conversation: 'Agent Speech'
} as const
