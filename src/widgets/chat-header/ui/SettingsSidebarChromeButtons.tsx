import {
  CHAT_CHROME_FIXED_POSITION_CLASS,
  CHAT_CHROME_ROW_HEIGHT_CLASS,
  SETTINGS_CHROME_ACTIONS_WIDTH_PX
} from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { SettingsSidebarChromePrimaryActions } from '@/widgets/app-sidebar/ui/SidebarChromeActions'

/** Fixed settings chrome — same viewport position expanded and collapsed. */
export function SettingsSidebarChromeButtons({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        CHAT_CHROME_FIXED_POSITION_CLASS,
        CHAT_CHROME_ROW_HEIGHT_CLASS,
        'pointer-events-auto flex items-center',
        className
      )}
      style={{ width: SETTINGS_CHROME_ACTIONS_WIDTH_PX }}
      data-settings-chrome-actions
    >
      <SettingsSidebarChromePrimaryActions />
    </div>
  )
}
