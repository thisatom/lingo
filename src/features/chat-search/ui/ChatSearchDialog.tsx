import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { flattenSidebarChats } from '@/shared/lib/chat-sidebar'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/shared/ui/command'

interface ChatSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatSearchDialog({ open, onOpenChange }: ChatSearchDialogProps) {
  const navigate = useNavigate()
  const chats = useChatsStore((s) => s.chats)
  const selectChat = useChatsStore((s) => s.selectChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)

  const orderedChats = useMemo(
    () => flattenSidebarChats(chats, sidebarShowDateGroups, sidebarChatSort),
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
      description="Find and open a chat"
      className="max-w-lg border-border bg-popover"
    >
      <CommandInput placeholder="Search chats…" />
      <CommandList className="max-h-[min(50vh,20rem)]">
        <CommandEmpty>No chats found</CommandEmpty>
        <CommandGroup heading="Chats">
          {orderedChats.map((chat) => (
            <CommandItem
              key={chat.id}
              value={`${chat.title} ${chat.id}`}
              onSelect={() => pickChat(chat.id)}
            >
              <span className="line-clamp-1">{chat.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
