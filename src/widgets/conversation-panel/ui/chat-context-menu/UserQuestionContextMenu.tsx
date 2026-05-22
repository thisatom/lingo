import type { ReactNode } from 'react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { sidebarMenuItemClass, sidebarMenuSurfaceClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import { chatSelectableClass } from '@/widgets/conversation-panel/ui/agent-layout'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/shared/ui/context-menu'

interface UserQuestionContextMenuProps {
  children: ReactNode
  prompt: string
  chatId: string | null
  className?: string
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
}

export function UserQuestionContextMenu({
  children,
  prompt,
  chatId,
  className,
  onDoubleClick
}: UserQuestionContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn('min-w-0', chatSelectableClass, className)}
          data-user-question-block
          onDoubleClick={onDoubleClick}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn('w-52 p-1', sidebarMenuSurfaceClass)}>
        <ContextMenuItem
          className={sidebarMenuItemClass}
          disabled={!prompt.trim()}
          onSelect={() => void copyToClipboard(prompt)}
        >
          Copy prompt
        </ContextMenuItem>
        <ContextMenuSeparator className="my-1 bg-border/60" />
        <ContextMenuItem
          className={sidebarMenuItemClass}
          disabled={!chatId}
          onSelect={() => {
            if (chatId) void copyToClipboard(chatId)
          }}
        >
          Copy request ID
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
