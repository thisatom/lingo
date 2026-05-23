import { SidebarLoadingSkeleton } from '@/widgets/app-sidebar/ui/SidebarLoadingSkeleton'
import { MainChatLoadingSkeleton } from '@/widgets/conversation-panel/ui/MainChatLoadingSkeleton'

export function AppStartupOverlay() {
  return (
    <div
      className="absolute inset-0 z-[9998] flex bg-background"
      aria-busy="true"
      aria-label="Loading application"
    >
      <div className="flex h-full w-[22%] min-w-[14rem] max-w-[40%] shrink-0 border-r border-border">
        <SidebarLoadingSkeleton />
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <MainChatLoadingSkeleton />
      </div>
    </div>
  )
}
