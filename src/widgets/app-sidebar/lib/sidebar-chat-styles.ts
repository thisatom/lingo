import type { PipelineStage } from '@/entities/conversation/model/store'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'

/** Sidebar chat list — neutral default, no pure white. */
export const sidebarChatTextClass = 'text-[#a3a3a3]'

/** Active chat row. */
export const sidebarChatActiveTextClass =
  'data-[active=true]:bg-sidebar-accent data-[active=true]:text-[#d4d4d4] data-[active=true]:font-normal'

/** Hover on chat row. */
export const sidebarChatHoverTextClass =
  'hover:bg-sidebar-accent hover:text-[#c8c8c8]'

/** Static sidebar dot (left of chat title). */
export const sidebarChatDotSizePx = 6

/** Agent cluster animation dots (small grid). */
export const sidebarAgentDotSizePx = 2

export const sidebarChatRowRadiusClass = APP_RADIUS_8_CLASS

export const sidebarChatDotClass = 'bg-[#606060]'

export const sidebarChatDotErrorClass = 'bg-[#e05252]'

export const sidebarChatDotSizeClass = 'size-1.5'

export const sidebarAgentDotClass = 'bg-[#a8a8a8]'

export const SIDEBAR_AGENT_STAGES: PipelineStage[] = ['thinking', 'searching', 'speaking']

export function isSidebarAgentStage(stage: PipelineStage): boolean {
  return SIDEBAR_AGENT_STAGES.includes(stage)
}
