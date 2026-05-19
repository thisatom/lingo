import { PanelLeft } from 'lucide-react'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

export function SidebarExpandButton() {
  const { sidebarCollapsed, toggleSidebarPanel } = useResizableSidebar()

  if (!sidebarCollapsed) return null

  return (
    <TooltipIconButton
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      tooltip="Show sidebar"
      onClick={toggleSidebarPanel}
    >
      <PanelLeft className="size-4" />
    </TooltipIconButton>
  )
}
