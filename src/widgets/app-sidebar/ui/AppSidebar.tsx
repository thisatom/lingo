import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NewChat } from '@/shared/ui/icons'
import { useChatsStore } from '@/entities/chat/model/store'
import { useConversationStore } from '@/entities/conversation/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useChatSearchHotkey } from '@/features/chat-search/model/useChatSearchHotkey'
import { ChatSearchDialog } from '@/features/chat-search/ui/ChatSearchDialog'
import { groupChatsByDate } from '@/shared/lib/chat-sidebar'
import { Button } from '@/shared/ui/button'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { APP_RADIUS_8_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import {
  isSidebarAgentStage,
  sidebarRowHeightClass
} from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
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
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)
  const resortChats = useChatsStore((s) => s.resortChats)
  const pipelineStage = useConversationStore((s) => s.stage)
  const isSettings = location.pathname.startsWith('/settings')

  useEffect(() => {
    resortChats()
  }, [sidebarChatSort, resortChats])

  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useChatSearchHotkey(openSearch)

  const { pinnedChats, unpinnedChats } = useMemo(() => {
    const pinned = chats.filter((c) => c.pinned)
    const unpinned = chats.filter((c) => !c.pinned)
    return { pinnedChats: pinned, unpinnedChats: unpinned }
  }, [chats])

  const dateGroups = useMemo(
    () => (sidebarShowDateGroups ? groupChatsByDate(unpinnedChats, sidebarChatSort) : []),
    [sidebarShowDateGroups, unpinnedChats, sidebarChatSort]
  )

  const flatUnpinned = sidebarShowDateGroups ? [] : unpinnedChats

  const agentActiveForChat =
    !isSettings && isSidebarAgentStage(pipelineStage) ? activeChatId : null

  const renderChat = (chat: (typeof chats)[number]) => (
    <ChatListItem
      key={chat.id}
      chat={chat}
      isActive={!isSettings && chat.id === activeChatId}
      agentActive={chat.id === agentActiveForChat}
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
          <SidebarContent className="min-h-0 flex-1 overflow-hidden px-2">
            <CustomScrollArea variant="sidebar" className="h-full min-h-0">
              <SettingsSidebarNav />
            </CustomScrollArea>
          </SidebarContent>
        ) : (
          <>
            <SidebarHeader className="gap-2 p-2">
              <SidebarTopActions onOpenSearch={openSearch} />
              <Button
                className={cn(
                  'w-full justify-start gap-2 px-2 has-[>svg]:px-2 border-border/60 bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground',
                  sidebarRowHeightClass,
                  APP_RADIUS_8_CLASS
                )}
                size="sm"
                variant="outline"
                aria-label="New chat"
                onClick={() => createChat()}
              >
                <NewChat className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-left">New chat</span>
                <KbdGroup className="shrink-0" aria-hidden>
                  <Kbd>Ctrl</Kbd>
                  <Kbd>N</Kbd>
                </KbdGroup>
              </Button>
            </SidebarHeader>

            <SidebarContent className="min-h-0 flex-1 overflow-hidden">
              <CustomScrollArea variant="sidebar" className="h-full min-h-0">
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
              </CustomScrollArea>
            </SidebarContent>
          </>
        )}

        <SidebarUserFooter />
      </Sidebar>

      {!isSettings && <ChatSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  )
}
