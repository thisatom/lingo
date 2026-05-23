import type { PipelineStage } from '@/entities/conversation/model/store'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'

/** Sidebar chat list — neutral default. */
export const sidebarChatTextClass = 'text-muted-foreground'

/** Active chat row. */
export const sidebarChatActiveTextClass =
  'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-normal'

/** Hover on chat row. */
export const sidebarChatHoverTextClass =
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

/** Static sidebar dot (left of chat title). */
export const sidebarChatDotSizePx = 6

/** Agent cluster animation dots (small grid). */
export const sidebarAgentDotSizePx = 2

export const sidebarChatRowRadiusClass = APP_RADIUS_8_CLASS

/** List row height for chats, settings nav, and primary sidebar actions. */
export const sidebarRowHeightClass = 'h-[30px] min-h-[30px]'

export const sidebarChatDotClass = 'bg-muted-foreground/70'

export const sidebarChatDotErrorClass = 'bg-destructive'

export const sidebarChatUnreadDotClass = 'bg-blue-500'

export const sidebarChatDotSizeClass = 'size-1.5'

/** Sidebar chrome icon buttons (top bar, filter) — not settings. */
export const sidebarChromeIconButtonClass =
  'size-6 shrink-0 text-muted-foreground hover:text-foreground'

/** Pin / delete: keep hit area, no hover background. */
export const sidebarRowActionNoHoverBgClass =
  'hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent data-[state=open]:bg-transparent'

export const sidebarAgentDotClass = 'bg-muted-foreground'

export const SIDEBAR_AGENT_STAGES: PipelineStage[] = [
  'listening',
  'transcribing',
  'thinking',
  'searching',
  'speaking'
]

export function isSidebarAgentStage(stage: PipelineStage): boolean {
  return SIDEBAR_AGENT_STAGES.includes(stage)
}
