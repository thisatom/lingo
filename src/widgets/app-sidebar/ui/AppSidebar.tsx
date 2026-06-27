import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { navigateToChat, chatRoutePath } from '@/features/chat/lib/chat-route'
import { groupChatsByDate } from '@/shared/lib/chat-sidebar'
import { SIDEBAR_INSET_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import { sidebarGroupLabelClass } from '@/widgets/app-sidebar/lib/sidebar-chat-styles'
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
  const navigate = useNavigate()
  const chats = useChatsStore((s) => s.chats)
  const activeChatId = useChatsStore((s) => s.activeChatId)
  const createChat = useChatsStore((s) => s.createChat)
  const selectChat = useChatsStore((s) => s.selectChat)
  const deleteChat = useChatsStore((s) => s.deleteChat)
  const togglePinChat = useChatsStore((s) => s.togglePinChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)
  const resortChats = useChatsStore((s) => s.resortChats)
  const isSettings = location.pathname.startsWith('/settings')

  useEffect(() => {
    resortChats()
  }, [sidebarChatSort, resortChats])

  const handleNewChat = useCallback(() => {
    const id = createChat()
    navigate(chatRoutePath(id))
  }, [createChat, navigate])

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

  const renderChat = (chat: (typeof chats)[number]) => (
    <ChatListItem
      key={chat.id}
      chat={chat}
      isActive={!isSettings && chat.id === activeChatId}
      onOpen={() => navigateToChat(navigate, chat.id, selectChat)}
      onTogglePin={() => togglePinChat(chat.id)}
      onDelete={() => deleteChat(chat.id)}
    />
  )

  return (
    <Sidebar collapsible="none" className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar">
      {isSettings ? (
        <SidebarContent className={cn('min-h-0 flex-1 overflow-hidden pt-3', SIDEBAR_INSET_CLASS)}>
          <CustomScrollArea variant="settings" className="h-full min-h-0">
            <SettingsSidebarNav />
          </CustomScrollArea>
        </SidebarContent>
      ) : (
        <>
          <SidebarHeader className={cn('shrink-0 py-2', SIDEBAR_INSET_CLASS)}>
            <SidebarTopActions onNewChat={handleNewChat} />
          </SidebarHeader>

          <SidebarContent className={cn('min-h-0 flex-1 overflow-hidden pb-1', SIDEBAR_INSET_CLASS)}>
            <CustomScrollArea variant="sidebar" className="h-full min-h-0">
              {pinnedChats.length > 0 && (
                <SidebarGroup className="gap-0.5 p-0">
                  <SidebarGroupLabel className={sidebarGroupLabelClass}>Pinned</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{pinnedChats.map(renderChat)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {sidebarShowDateGroups
                ? dateGroups.map((group) => (
                    <SidebarGroup key={group.dateKey} className="gap-0.5 p-0">
                      <SidebarGroupLabel className={sidebarGroupLabelClass}>
                        {group.label}
                      </SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>{group.chats.map(renderChat)}</SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ))
                : flatUnpinned.length > 0 && (
                    <SidebarGroup className="gap-0.5 p-0">
                      <SidebarGroupContent>
                        <SidebarMenu>{flatUnpinned.map(renderChat)}</SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  )}
            </CustomScrollArea>
          </SidebarContent>
        </>
      )}

      <SidebarUserFooter insetClassName={SIDEBAR_INSET_CLASS} />
    </Sidebar>
  )
}
