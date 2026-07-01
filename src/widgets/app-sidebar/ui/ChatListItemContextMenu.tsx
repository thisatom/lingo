import { useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Chat } from '@/entities/chat/model/types'
import { useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import {
  menuSeparatorClass,
  sidebarMenuItemClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { Archive, CircleFilled, GitBranch, Pencil, Pin } from '@/shared/ui/icons'
import { cn } from '@/shared/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/shared/ui/context-menu'
import { ShortcutKeys, useResolvedShortcut } from '@/features/keyboard-shortcuts/ui/ShortcutKeys'
import type { ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'
import { ChatRenameDialog } from './ChatRenameDialog'

interface ChatListItemContextMenuProps {
  chat: Chat
  children: ReactNode
  onArchive: () => void
}

function MenuRow({
  icon: Icon,
  label,
  onSelect,
  shortcutId
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  onSelect: () => void
  shortcutId?: ShortcutId
}) {
  const shortcut = shortcutId ? useResolvedShortcut(shortcutId) : null

  return (
    <ContextMenuItem className={sidebarMenuItemClass} onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
      {shortcut ? <ShortcutKeys shortcut={shortcut} className="ml-2 shrink-0 opacity-70" /> : null}
    </ContextMenuItem>
  )
}

export function ChatListItemContextMenu({
  chat,
  children,
  onArchive
}: ChatListItemContextMenuProps) {
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const togglePinChat = useChatsStore((s) => s.togglePinChat)
  const renameChat = useChatsStore((s) => s.renameChat)
  const setChatUnreadReply = useChatsStore((s) => s.setChatUnreadReply)
  const forkChat = useChatsStore((s) => s.forkChat)

  const pinned = Boolean(chat.pinned)
  const archived = Boolean(chat.archived)

  return (
    <>
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className={cn('w-52', sidebarMenuSurfaceClass)}>
          <MenuRow
            icon={Pin}
            label={pinned ? 'Unpin' : 'Pin'}
            onSelect={() => togglePinChat(chat.id)}
          />
          <MenuRow icon={Pencil} label="Rename" onSelect={() => setRenameOpen(true)} />
          <MenuRow
            icon={CircleFilled}
            label="Mark as unread"
            onSelect={() => setChatUnreadReply(chat.id, true)}
          />
          <ContextMenuSeparator className={menuSeparatorClass} />
          <MenuRow
            icon={GitBranch}
            label="Fork chat"
            onSelect={() => {
              const forkedId = forkChat(chat.id)
              navigate(chatRoutePath(forkedId))
            }}
          />
          <ContextMenuSeparator className={menuSeparatorClass} />
          <MenuRow
            icon={Archive}
            label={archived ? 'Unarchive' : 'Archive'}
            shortcutId={archived ? undefined : 'archiveChat'}
            onSelect={onArchive}
          />
        </ContextMenuContent>
      </ContextMenu>

      <ChatRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        initialTitle={chat.title}
        onConfirm={(title) => renameChat(chat.id, title)}
      />
    </>
  )
}
