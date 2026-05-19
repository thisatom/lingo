import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageSquarePlus } from 'lucide-react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useChatSearchHotkey } from '@/features/chat-search/model/useChatSearchHotkey'
import { ChatSearchDialog } from '@/features/chat-search/ui/ChatSearchDialog'
import { SidebarCustomizeSheet } from '@/features/sidebar-customize/ui/SidebarCustomizeSheet'
import { groupChatsByDate } from '@/shared/lib/chat-sidebar'
import { Button } from '@/shared/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu
} from '@/shared/ui/sidebar'
import { ChatListItem } from './ChatListItem'
import { SettingsSidebarNav } from './SettingsSidebarNav'
import { SidebarTopActions } from './SidebarTopActions'
import { SidebarUserFooter } from './SidebarUserFooter'

export function AppSidebar() {
  const location = useLocation()
  const chats = useChatsStore((s) => s.chats)
  const activeChatId = useChatsStore((s) => s.activeChatId)
  const createChat = useChatsStore((s) => s.createChat)
  const selectChat = useChatsStore((s) => s.selectChat)
  const deleteChat = useChatsStore((s) => s.deleteChat)
  const togglePinChat = useChatsStore((s) => s.togglePinChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)

  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useChatSearchHotkey(openSearch)

  const isSettings = location.pathname.startsWith('/settings')

  const { pinnedChats, unpinnedChats } = useMemo(() => {
    const pinned = chats.filter((c) => c.pinned)
    const unpinned = chats.filter((c) => !c.pinned)
    return { pinnedChats: pinned, unpinnedChats: unpinned }
  }, [chats])

  const dateGroups = useMemo(
    () => (sidebarShowDateGroups ? groupChatsByDate(unpinnedChats) : []),
    [sidebarShowDateGroups, unpinnedChats]
  )

  const flatUnpinned = sidebarShowDateGroups ? [] : unpinnedChats

  const renderChat = (chat: (typeof chats)[number]) => (
    <ChatListItem
      key={chat.id}
      chat={chat}
      isActive={!isSettings && chat.id === activeChatId}
      onOpen={() => selectChat(chat.id)}
      onTogglePin={() => togglePinChat(chat.id)}
      onDelete={() => deleteChat(chat.id)}
    />
  )

  return (
    <>
      <Sidebar
        collapsible="none"
        className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar"
      >
        {isSettings ? (
          <SidebarContent className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2">
            <SettingsSidebarNav />
          </SidebarContent>
        ) : (
          <>
            <SidebarHeader className="gap-2 p-2">
              <SidebarTopActions onOpenSearch={openSearch} />
              <Button
                className="mx-1 w-[calc(100%-0.5rem)] justify-start gap-2 border-border/60 bg-muted/30 hover:bg-muted/50"
                size="sm"
                variant="outline"
                onClick={() => createChat()}
              >
                <MessageSquarePlus className="size-4" />
                New chat
              </Button>
            </SidebarHeader>

            <SidebarContent className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {pinnedChats.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs text-muted-foreground">
                    Pinned
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{pinnedChats.map(renderChat)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {sidebarShowDateGroups
                ? dateGroups.map((group) => (
                    <SidebarGroup key={group.dateKey}>
                      <SidebarGroupLabel className="text-xs font-normal text-muted-foreground">
                        {group.label}
                      </SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>{group.chats.map(renderChat)}</SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ))
                : flatUnpinned.length > 0 && (
                    <SidebarGroup>
                      <SidebarGroupContent>
                        <SidebarMenu>{flatUnpinned.map(renderChat)}</SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  )}
            </SidebarContent>
          </>
        )}

        <SidebarUserFooter onCustomize={() => setCustomizeOpen(true)} />
      </Sidebar>

      {!isSettings && <ChatSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
      <SidebarCustomizeSheet open={customizeOpen} onOpenChange={setCustomizeOpen} />
    </>
  )
}
