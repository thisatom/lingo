import type { Chat } from '@/entities/chat/model/types'
import type { Message } from '@/entities/message/model/types'
import type { ChatContextUsageDetails } from '@/shared/lib/chat-context-usage'
import {
  CHAT_CHROME_ROW_HEIGHT_CLASS,
  CHAT_HEADER_MENU_RESERVE_PX,
  CHAT_HORIZONTAL_PADDING_CLASS,
  CHAT_TITLE_COLLAPSED_MARGIN_CLASS
} from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { useIsMobile } from '@/shared/lib/hooks/use-mobile'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'
import { ChatHeaderMenu } from './ChatHeaderMenu'
import { ChatHeaderTitle } from './ChatHeaderTitle'

interface ChatMainHeaderProps {
  title: string
  chat: Chat | null | undefined
  messageCount: number
  modelId: string
  contextUsage: ChatContextUsageDetails | null
  contextPercent: number
  activeChatId: string | null
  messages: readonly Message[]
}

export function ChatMainHeader({
  title,
  chat,
  messageCount,
  modelId,
  contextUsage,
  contextPercent,
  activeChatId,
  messages
}: ChatMainHeaderProps) {
  const isMobile = useIsMobile()
  const { sidebarCollapsed, sidebarHideEnabled } = useResizableSidebar()
  const titleInsetWhenCollapsed = sidebarHideEnabled && !isMobile && sidebarCollapsed

  return (
    <header
      className={cn(
        'relative z-10 shrink-0 pb-1 pt-2',
        CHAT_HORIZONTAL_PADDING_CLASS
      )}
    >
      <ChatHeaderMenu
        chatId={activeChatId}
        messages={messages}
        className="absolute top-[calc(0.5rem+15px)] z-20 -translate-y-1/2 right-2 shrink-0 sm:right-3 md:right-4"
      />

      <div
        className={cn(
          CHAT_CHROME_ROW_HEIGHT_CLASS,
          'relative z-10 flex min-w-0 items-center overflow-hidden',
          titleInsetWhenCollapsed ? CHAT_TITLE_COLLAPSED_MARGIN_CLASS : 'ml-0'
        )}
        style={{ marginRight: CHAT_HEADER_MENU_RESERVE_PX }}
      >
        <ChatHeaderTitle
          title={title}
          chat={chat}
          messageCount={messageCount}
          modelId={modelId}
          contextUsage={contextUsage}
          contextPercent={contextPercent}
        />
      </div>
    </header>
  )
}
