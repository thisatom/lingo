import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { CHAT_CHROME_ROW_HEIGHT_CLASS, SETTINGS_CHROME_ACTIONS_WIDTH_PX } from '@/shared/lib/layout'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { SettingsSidebarChromePrimaryActions } from '@/widgets/app-sidebar/ui/SidebarChromeActions'

export function SettingsSidebarTopActions() {
  const isMobile = useIsMobile()
  const { sidebarHideEnabled } = useResizableSidebar()
  const fixedPrimaryChrome = sidebarHideEnabled && !isMobile

  return (
    <div className={`flex ${CHAT_CHROME_ROW_HEIGHT_CLASS} min-w-0 items-center gap-0.5`}>
      {fixedPrimaryChrome ? (
        <div
          className="shrink-0"
          style={{ width: SETTINGS_CHROME_ACTIONS_WIDTH_PX }}
          aria-hidden
        />
      ) : (
        <SettingsSidebarChromePrimaryActions />
      )}
    </div>
  )
}
