import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { formatChatDateLabel } from '@/shared/lib/chat-sidebar'
import {
  buildChatCommandSearchGroups,
  buildChatCommandSearchValue
} from '@/features/chat-search/lib/chat-command-search'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/shared/ui/command'

interface ChatSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChatCommandRow({ chat }: { chat: { id: string; title: string; updatedAt: number } }) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 truncate">{chat.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatChatDateLabel(chat.updatedAt)}
      </span>
    </div>
  )
}

export function ChatSearchDialog({ open, onOpenChange }: ChatSearchDialogProps) {
  const navigate = useNavigate()
  const chats = useChatsStore((s) => s.chats)
  const selectChat = useChatsStore((s) => s.selectChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)

  const { pinned, dateGroups, flat } = useMemo(
    () => buildChatCommandSearchGroups(chats, sidebarShowDateGroups, sidebarChatSort),
    [chats, sidebarShowDateGroups, sidebarChatSort]
  )

  const pickChat = (id: string) => {
    selectChat(id)
    onOpenChange(false)
    navigate('/')
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search chats"
      description="Find and open a chat by title or date"
      className="max-w-lg"
    >
      <CommandInput placeholder="Search by title or date…" />
      <CommandList className="max-h-[min(50vh,20rem)]">
        <CommandEmpty>No chats found</CommandEmpty>

        {pinned.length > 0 ? (
          <CommandGroup heading="Pinned">
            {pinned.map((chat) => (
              <CommandItem
                key={chat.id}
                value={buildChatCommandSearchValue(chat, 'Pinned')}
                onSelect={() => pickChat(chat.id)}
              >
                <ChatCommandRow chat={chat} />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {dateGroups.length > 0 ? (
          dateGroups.map((group, index) => (
            <div key={group.dateKey}>
              {index > 0 || pinned.length > 0 ? <CommandSeparator className="my-1" /> : null}
              <CommandGroup heading={group.label}>
                {group.chats.map((chat) => (
                  <CommandItem
                    key={chat.id}
                    value={buildChatCommandSearchValue(chat, group.label)}
                    onSelect={() => pickChat(chat.id)}
                  >
                    <ChatCommandRow chat={chat} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))
        ) : (
          <CommandGroup heading="Chats">
            {flat.map((chat) => (
              <CommandItem
                key={chat.id}
                value={buildChatCommandSearchValue(chat, formatChatDateLabel(chat.updatedAt))}
                onSelect={() => pickChat(chat.id)}
              >
                <ChatCommandRow chat={chat} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
