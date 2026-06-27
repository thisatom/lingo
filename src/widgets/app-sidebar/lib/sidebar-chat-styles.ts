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

/** Date / section labels — align with top chrome column. */
export const sidebarGroupLabelClass =
  'flex h-[30px] min-h-[30px] items-center px-0 text-xs font-normal text-muted-foreground'

/** Shared fade for long chat titles — reserve right edge for row actions. */
export const sidebarTextFadeClass = cn(
  'block min-w-0 overflow-hidden whitespace-nowrap text-clip',
  '[mask-image:linear-gradient(90deg,#000_0%,#000_calc(100%-1rem),transparent_100%)]'
)

/** Settings nav labels — short fixed copy, no edge mask. */
export const sidebarNavLabelClass = 'min-w-0 truncate'

/** Wrapper for chat title + hover scrim. */
export const sidebarChatTitleFadeClass = 'relative min-w-0 flex-1'

/** Scrim over title when row actions are visible — match row hover/active fill, not page bg. */
export const sidebarChatTitleScrimClass =
  'pointer-events-none absolute inset-y-0 right-0 z-0 w-12 bg-gradient-to-l from-accent from-30% to-transparent opacity-0 transition-opacity duration-100 group-hover/chat:opacity-100 group-data-[active=true]/chat:from-sidebar-accent'

/** Pin / delete: keep hit area, no hover background (pin only). */
export const sidebarRowActionNoHoverBgClass =
  'hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent data-[state=open]:bg-transparent'

/** Delete action — transparent; row hover supplies background. */
export const sidebarChatDeleteButtonClass = cn(
  'relative z-[2] rounded-lg border-0 bg-transparent text-muted-foreground/55 opacity-0 shadow-none',
  'transition-[opacity,color] duration-100',
  'group-hover/chat:pointer-events-auto group-hover/chat:opacity-100',
  'hover:!bg-transparent hover:!text-foreground active:!bg-transparent',
  'focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:text-foreground'
)

/** List row height for chats, settings nav, and primary sidebar actions. */
export const sidebarRowHeightClass = 'h-[30px] min-h-[30px]'

/** Row action hit target — matches 30px row height. */
export const sidebarRowActionSizeClass = 'size-[30px] shrink-0'

/** Icon column for settings nav and other sidebar rows without a status dot. */
export const sidebarNavIconColumnClass = cn(
  sidebarRowActionSizeClass,
  'flex items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-70'
)

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
