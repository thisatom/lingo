import {
  CHAT_CHROME_ACTIONS_WIDTH_PX,
  CHAT_CHROME_FIXED_POSITION_CLASS,
  CHAT_CHROME_ROW_HEIGHT_CLASS
} from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { SidebarChromePrimaryActions } from '@/widgets/app-sidebar/ui/SidebarChromeActions'

/** Fixed primary chrome — same viewport position expanded and collapsed. */
export function ChatSidebarChromeButtons({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        CHAT_CHROME_FIXED_POSITION_CLASS,
        CHAT_CHROME_ROW_HEIGHT_CLASS,
        'pointer-events-auto flex items-center',
        className
      )}
      style={{ width: CHAT_CHROME_ACTIONS_WIDTH_PX }}
      data-chat-chrome-actions
    >
      <SidebarChromePrimaryActions />
    </div>
  )
}
