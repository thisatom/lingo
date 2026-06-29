import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { CHAT_CHROME_ACTIONS_WIDTH_PX, CHAT_CHROME_ROW_HEIGHT_CLASS } from '@/shared/lib/layout'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import {
  SidebarChromeHistoryActions,
  SidebarChromePrimaryActions
} from '@/widgets/app-sidebar/ui/SidebarChromeActions'

/** Top sidebar row — aligned with section labels (Pinned, dates). */
export function SidebarTopActions() {
  const isMobile = useIsMobile()
  const { sidebarHideEnabled } = useResizableSidebar()
  const fixedPrimaryChrome = sidebarHideEnabled && !isMobile

  return (
    <div className={`flex ${CHAT_CHROME_ROW_HEIGHT_CLASS} min-w-0 items-center gap-0.5`}>
      {fixedPrimaryChrome ? (
        <div
          className="shrink-0"
          style={{ width: CHAT_CHROME_ACTIONS_WIDTH_PX }}
          aria-hidden
        />
      ) : (
        <SidebarChromePrimaryActions />
      )}
      <div className="min-w-0 flex-1" aria-hidden />
      <SidebarChromeHistoryActions />
    </div>
  )
}
