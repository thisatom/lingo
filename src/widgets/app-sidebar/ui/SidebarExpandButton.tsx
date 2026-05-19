import { PanelLeft } from 'lucide-react'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { Button } from '@/shared/ui/button'

export function SidebarExpandButton() {
  const { sidebarCollapsed, toggleSidebarPanel } = useResizableSidebar()

  if (!sidebarCollapsed) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      title="Show sidebar"
      aria-label="Show sidebar"
      onClick={toggleSidebarPanel}
    >
      <PanelLeft className="size-4" />
    </Button>
  )
}
