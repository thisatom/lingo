import { PanelLeftOpen } from '@/shared/ui/icons'
import { sidebarChromeIconButtonClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

export function SidebarExpandButton() {
  const { sidebarCollapsed, toggleSidebarPanel } = useResizableSidebar()

  if (!sidebarCollapsed) return null

  return (
    <TooltipIconButton
      variant="ghost"
      size="icon"
      className={sidebarChromeIconButtonClass}
      tooltip="Show sidebar"
      aria-label="Show sidebar"
      onClick={toggleSidebarPanel}
    >
      <PanelLeftOpen className="size-4 shrink-0" />
    </TooltipIconButton>
  )
}
