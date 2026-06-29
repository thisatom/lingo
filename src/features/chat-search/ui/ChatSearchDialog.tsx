import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Chat } from '@/entities/chat/model/types'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { formatChatTimeLabel } from '@/shared/lib/chat-sidebar'
import {
  buildChatCommandSearchGroups
} from '@/features/chat-search/lib/chat-command-search'
import { findChatMessageSnippet } from '@/features/chat-search/lib/chat-search-match'
import { filterChatsByQuery } from '@/features/chat-search/lib/filter-chats'
import { navigateToChat } from '@/features/chat/lib/chat-route'
import { parseChatIdFromInput } from '@/features/chat/lib/parse-chat-id'
import { useDeferredResetOnClose } from '@/shared/lib/use-deferred-reset-on-close'
import { NewChat, Pin, Settings } from '@/shared/ui/icons'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandSeparator,
  CommandShortcut
} from '@/shared/ui/command'

interface ChatSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChatCommandRow({ chat, query }: { chat: Chat; query: string }) {
  const snippet = findChatMessageSnippet(chat, query)

  return (
    <div className="flex w-full min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {chat.pinned ? <Pin className="size-3.5 shrink-0 text-muted-foreground" /> : null}
          <span className="min-w-0 truncate">{chat.title}</span>
          {chat.archived ? (
            <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
              archived
            </span>
          ) : null}
        </div>
        {snippet ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{snippet}</p>
        ) : null}
      </div>
      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {formatChatTimeLabel(chat.updatedAt)}
      </span>
    </div>
  )
}

export function ChatSearchDialog({ open, onOpenChange }: ChatSearchDialogProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedChatId, setSelectedChatId] = useState('')
  const chats = useChatsStore((s) => s.chats)
  const selectChat = useChatsStore((s) => s.selectChat)
  const createChat = useChatsStore((s) => s.createChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)

  const resetPaletteState = useCallback(() => {
    setSearch('')
    setSelectedChatId('')
  }, [])

  useDeferredResetOnClose(open, resetPaletteState)

  const visibleChats = useMemo(
    () => filterChatsByQuery(chats, search),
    [chats, search]
  )

  const { pinned, dateGroups, flat } = useMemo(
    () =>
      buildChatCommandSearchGroups(
        visibleChats,
        sidebarShowDateGroups,
        sidebarChatSort
      ),
    [visibleChats, sidebarShowDateGroups, sidebarChatSort]
  )

  const parsedChatId = useMemo(() => parseChatIdFromInput(search), [search])
  const chatFromParsedId = useMemo(
    () => (parsedChatId ? chats.find((chat) => chat.id === parsedChatId) : undefined),
    [chats, parsedChatId]
  )

  const pickChat = useCallback(
    (id: string) => {
      if (!navigateToChat(navigate, id, selectChat)) return
      onOpenChange(false)
    },
    [navigate, onOpenChange, selectChat]
  )

  const handleNewChat = useCallback(() => {
    const id = createChat()
    navigate(chatRoutePath(id))
    onOpenChange(false)
  }, [createChat, navigate, onOpenChange])

  const openSettings = useCallback(() => {
    navigate('/settings/general')
    onOpenChange(false)
  }, [navigate, onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search chats"
      description="Find chats, jump to settings, or start a new conversation"
      commandValue={selectedChatId}
      onCommandValueChange={setSelectedChatId}
      shouldFilter={false}
    >
      <CommandPaletteInput
        placeholder="Search chats, messages, dates, or chat ID…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList variant="palette">
        <CommandGroup variant="palette" heading="Actions">
          <CommandItem variant="palette" value="__action_new_chat" onSelect={handleNewChat}>
            <NewChat className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">New chat</span>
            <CommandShortcut>
              <KbdGroup className="opacity-90" aria-hidden>
                <Kbd>Ctrl</Kbd>
                <Kbd>N</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem variant="palette" value="__action_settings" onSelect={openSettings}>
            <Settings className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">Open settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator variant="palette" />

        {chatFromParsedId ? (
          <CommandGroup variant="palette" heading="Chat ID">
            <CommandItem
              variant="palette"
              value={chatFromParsedId.id}
              onSelect={() => pickChat(chatFromParsedId.id)}
            >
              <div className="flex w-full min-w-0 flex-col gap-0.5">
                <span className="truncate">{chatFromParsedId.title}</span>
                <span className="truncate text-xs text-muted-foreground tabular-nums">
                  {chatFromParsedId.id}
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
        ) : null}

        {chatFromParsedId ? <CommandSeparator variant="palette" /> : null}

        <CommandEmpty variant="palette">No chats found</CommandEmpty>

        {pinned.length > 0 ? (
          <CommandGroup variant="palette" heading="Pinned">
            {pinned.map((chat) => (
              <CommandItem
                variant="palette"
                key={chat.id}
                value={chat.id}
                onSelect={() => pickChat(chat.id)}
              >
                <ChatCommandRow chat={chat} query={search} />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {dateGroups.length > 0
          ? dateGroups.map((group, index) => (
              <div key={group.dateKey}>
                {index > 0 || pinned.length > 0 ? (
                  <CommandSeparator variant="palette" />
                ) : null}
                <CommandGroup variant="palette" heading={group.label}>
                  {group.chats.map((chat) => (
                    <CommandItem
                      variant="palette"
                      key={chat.id}
                      value={chat.id}
                      onSelect={() => pickChat(chat.id)}
                    >
                      <ChatCommandRow chat={chat} query={search} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))
          : flat.length > 0 && (
              <CommandGroup variant="palette" heading="Chats">
                {flat.map((chat) => (
                  <CommandItem
                    variant="palette"
                    key={chat.id}
                    value={chat.id}
                    onSelect={() => pickChat(chat.id)}
                  >
                    <ChatCommandRow chat={chat} query={search} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
      </CommandList>
      <CommandPaletteFooter />
    </CommandDialog>
  )
}
