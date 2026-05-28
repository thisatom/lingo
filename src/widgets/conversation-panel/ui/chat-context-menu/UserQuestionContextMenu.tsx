import type { ReactNode } from 'react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { sidebarMenuItemClass, sidebarMenuSurfaceClass } from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import { chatNonSelectableClass } from '@/widgets/conversation-panel/ui/agent-layout'
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
  activateDisabled?: boolean
  onActivate?: () => void
}

export function UserQuestionContextMenu({
  children,
  prompt,
  chatId,
  className,
  activateDisabled = false,
  onActivate
}: UserQuestionContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role={onActivate && !activateDisabled ? 'button' : undefined}
          tabIndex={onActivate && !activateDisabled ? 0 : undefined}
          className={cn(
            'min-w-0',
            chatNonSelectableClass,
            className,
            onActivate && !activateDisabled && 'cursor-pointer'
          )}
          data-user-question-block
          onClick={() => {
            if (activateDisabled) return
            onActivate?.()
          }}
          onKeyDown={(event) => {
            if (activateDisabled || !onActivate) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onActivate()
            }
          }}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn('w-52', sidebarMenuSurfaceClass)}>
        <ContextMenuItem
          className={sidebarMenuItemClass}
          disabled={!prompt.trim()}
          onSelect={() => void copyToClipboard(prompt)}
        >
          Copy prompt
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-border/60" />
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
