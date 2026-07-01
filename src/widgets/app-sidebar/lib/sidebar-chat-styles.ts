import type { PipelineStage } from '@/entities/conversation/model/store'
import {
  iconButtonHoverClass,
  listRowHoverClass
} from '@/shared/lib/design-surface'
import { cn } from '@/shared/lib/utils'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'

/** Sidebar chat list — neutral default. */
export const sidebarChatTextClass = 'text-muted-foreground'

/** Active chat row. */
export const sidebarChatActiveTextClass =
  'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-normal'

/** Hover on chat row. */
export const sidebarChatHoverTextClass = listRowHoverClass

/** Static sidebar dot (left of chat title). */
export const sidebarChatDotSizePx = 6

/** Agent cluster animation dots (small grid). */
export const sidebarAgentDotSizePx = 2

export const sidebarChatRowRadiusClass = APP_RADIUS_8_CLASS

/** Date / section labels — sticky, full sidebar width; text uses {@link SIDEBAR_INSET_CLASS}. */
export const sidebarGroupLabelClass = cn(
  'sticky top-0 z-20 flex h-[30px] min-h-[30px] w-full items-center bg-sidebar px-0',
  'rounded-none !rounded-none text-xs font-normal text-muted-foreground',
  'transition-[box-shadow] duration-200 ease-out'
)

/** Shared fade for long chat titles — reserve right edge for row actions. */
export const sidebarTextFadeClass = cn(
  'block min-w-0 overflow-hidden whitespace-nowrap text-clip',
  '[mask-image:linear-gradient(90deg,#000_0%,#000_calc(100%-1rem),transparent_100%)]'
)

/** Settings nav labels — short fixed copy, no edge mask. */
export const sidebarNavLabelClass = 'min-w-0 truncate'

/** Wrapper for chat title + hover scrim. */
export const sidebarChatTitleFadeClass = 'relative min-w-0 flex-1'

/** List row height for chats, settings nav, and primary sidebar actions. */
export const sidebarRowHeightClass = 'h-[30px] min-h-[30px]'

/** Row action hit target — matches 30px row height. */
export const sidebarRowActionSizeClass = 'size-[30px] shrink-0'

/** Scrim over title — soft fade into row actions. */
export const sidebarChatTitleScrimClass =
  'pointer-events-none absolute inset-y-0 right-0 z-0 w-8 bg-gradient-to-l from-accent/90 from-20% to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover/chat:opacity-100 group-data-[active=true]/chat:from-sidebar-accent/90'

/** Width reserved for archive + delete row actions (2 × 30px). */
export const sidebarChatRowActionsPaddingClass = 'pr-[60px]'

/** Right action strip — shadow + buttons fade in together on row hover. */
export const sidebarChatRowActionsPanelClass = cn(
  'pointer-events-none absolute inset-y-0 right-0 z-[1] w-[60px]',
  'opacity-0 transition-opacity duration-200 ease-out',
  'group-hover/chat:pointer-events-auto group-hover/chat:opacity-100',
  'focus-within:pointer-events-auto focus-within:opacity-100'
)

/** Gradient shadow before archive / delete buttons. */
export const sidebarChatRowActionsShadowClass = cn(
  'pointer-events-none absolute inset-y-0 right-0 w-[60px]',
  'bg-gradient-to-l from-accent from-40% via-accent/70 via-70% to-transparent',
  'group-data-[active=true]/chat:from-sidebar-accent group-data-[active=true]/chat:via-sidebar-accent/70'
)

export const sidebarChatRowActionClass = cn(
  sidebarRowActionSizeClass,
  'relative z-[2] rounded-lg border-0 shadow-none text-muted-foreground/55',
  'transition-[color,background-color,filter] duration-200 ease-out',
  'hover:!bg-accent hover:!text-foreground active:!bg-accent',
  'group-data-[active=true]/chat:hover:!bg-sidebar-accent group-data-[active=true]/chat:active:!bg-sidebar-accent',
  'focus-visible:text-foreground focus-visible:!bg-accent',
  'group-data-[active=true]/chat:focus-visible:!bg-sidebar-accent'
)

/** Archive / delete — solid row fill on the action strip. */
export const sidebarChatInlineActionClass = cn(
  sidebarChatRowActionClass,
  '!bg-accent !text-foreground/80',
  'group-data-[active=true]/chat:!bg-sidebar-accent group-data-[active=true]/chat:!text-sidebar-accent-foreground',
  'hover:!brightness-[0.97] group-data-[active=true]/chat:hover:!brightness-[0.97]'
)

/** Pin stays visible when pinned; default icon matches row actions, light on hover. */
export const sidebarChatPinActionClass = cn(
  sidebarChatRowActionClass,
  'pointer-events-none opacity-0',
  'group-hover/chat:pointer-events-auto group-hover/chat:opacity-100',
  'focus-visible:pointer-events-auto focus-visible:opacity-100'
)

/** Pinned chat — keep pin visible; same muted default as other row actions. */
export const sidebarChatPinPinnedClass = 'pointer-events-auto opacity-100'

export const sidebarChatPinIconClass = 'size-3.5 shrink-0 text-current'

/** Delete / archive — same as row actions. */
export const sidebarChatDeleteButtonClass = sidebarChatInlineActionClass

/** Icon column for settings nav and other sidebar rows without a status dot. */
export const sidebarNavIconColumnClass = cn(
  sidebarRowActionSizeClass,
  'flex items-center justify-center',
  '[&_.codicon]:!translate-y-0 [&_.codicon]:size-4 [&_.codicon]:shrink-0 [&_.codicon]:opacity-70'
)

/** Back / nav row icon — snap to cap-height without codicon nudge. */
export const sidebarBackIconClass = 'size-4 shrink-0 opacity-70 !translate-y-0'

export const sidebarChatDotClass = 'bg-muted-foreground/70'

export const sidebarChatDotErrorClass = 'bg-destructive'

export const sidebarChatUnreadDotClass = 'bg-primary'

export const sidebarChatDotSizeClass = 'size-1.5'

/** Sidebar chrome icon buttons (top bar, filter) — not settings. */
export const sidebarChromeIconButtonClass = cn(
  'size-[30px] shrink-0 text-muted-foreground',
  iconButtonHoverClass
)

export { iconButtonHoverClass }

export const sidebarAgentDotClass = 'bg-muted-foreground'

export const SIDEBAR_AGENT_STAGES: PipelineStage[] = [
  'listening',
  'transcribing',
  'thinking',
  'searching',
  'speaking',
  'reconnecting'
]

export function isSidebarAgentStage(stage: PipelineStage): boolean {
  return SIDEBAR_AGENT_STAGES.includes(stage)
}
