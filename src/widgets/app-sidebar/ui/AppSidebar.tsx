import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { navigateToChat } from '@/features/chat/lib/chat-route'
import { groupChatsByDate } from '@/shared/lib/chat-sidebar'
import { SIDEBAR_INSET_CLASS } from '@/shared/lib/layout'
import { lingoToast } from '@/shared/ui/lingo-toast'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu
} from '@/shared/ui/sidebar'
import { ChatListItem } from './ChatListItem'
import { SidebarArchiveBar } from './SidebarArchiveBar'
import { SettingsSidebarNav } from './SettingsSidebarNav'
import { SettingsSidebarTopActions } from './SettingsSidebarTopActions'
import { SidebarStickyGroupLabel } from './SidebarStickyGroupLabel'
import { SidebarTopActions } from './SidebarTopActions'
import { SidebarUserFooter } from './SidebarUserFooter'

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const chats = useChatsStore((s) => s.chats)
  const activeChatId = useChatsStore((s) => s.activeChatId)
  const selectChat = useChatsStore((s) => s.selectChat)
  const deleteChat = useChatsStore((s) => s.deleteChat)
  const togglePinChat = useChatsStore((s) => s.togglePinChat)
  const archiveChat = useChatsStore((s) => s.archiveChat)
  const unarchiveChat = useChatsStore((s) => s.unarchiveChat)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups ?? true)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)
  const resortChats = useChatsStore((s) => s.resortChats)
  const isSettings = location.pathname.startsWith('/settings')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    resortChats()
  }, [sidebarChatSort, resortChats])

  const visibleChats = useMemo(
    () => chats.filter((chat) => (showArchived ? chat.archived : !chat.archived)),
    [chats, showArchived]
  )

  const { pinnedChats, unpinnedChats } = useMemo(() => {
    if (showArchived) {
      return { pinnedChats: [], unpinnedChats: visibleChats }
    }
    const pinned = visibleChats.filter((c) => c.pinned)
    const unpinned = visibleChats.filter((c) => !c.pinned)
    return { pinnedChats: pinned, unpinnedChats: unpinned }
  }, [visibleChats, showArchived])

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
      onArchive={() => {
        if (chat.archived) {
          unarchiveChat(chat.id)
          lingoToast.message('Chat restored', { description: chat.title })
          return
        }
        archiveChat(chat.id)
        lingoToast.message('Chat archived', { description: chat.title })
      }}
      onDelete={() => deleteChat(chat.id)}
    />
  )

  return (
    <Sidebar collapsible="none" className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-sidebar">
      {isSettings ? (
        <>
          <SidebarHeader className={cn('@container/sidebar-chrome shrink-0 py-2', SIDEBAR_INSET_CLASS)}>
            <SettingsSidebarTopActions />
          </SidebarHeader>
          <SidebarContent className={cn('min-h-0 flex-1 overflow-hidden pb-1', SIDEBAR_INSET_CLASS)}>
            <CustomScrollArea variant="settings" className="h-full min-h-0">
              <SettingsSidebarNav />
            </CustomScrollArea>
          </SidebarContent>
        </>
      ) : (
        <>
          <SidebarHeader className={cn('@container/sidebar-chrome shrink-0 pt-2 pb-1', SIDEBAR_INSET_CLASS)}>
            <SidebarTopActions />
          </SidebarHeader>

          <SidebarContent className="relative min-h-0 flex-1 overflow-hidden pb-1">
            {showArchived && visibleChats.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2">
                <p className="text-center text-xs text-muted-foreground">No archived chats</p>
              </div>
            ) : null}
            <CustomScrollArea variant="sidebar" className="h-full min-h-0">
              {showArchived && visibleChats.length === 0 ? (
                <SidebarGroup className="gap-0.5 p-0">
                  <SidebarStickyGroupLabel>Archived</SidebarStickyGroupLabel>
                </SidebarGroup>
              ) : (
                <>
                  {!showArchived && pinnedChats.length > 0 && (
                    <SidebarGroup className="gap-0.5 p-0">
                      <SidebarStickyGroupLabel>Pinned</SidebarStickyGroupLabel>
                      <SidebarGroupContent className={SIDEBAR_INSET_CLASS}>
                        <SidebarMenu>{pinnedChats.map(renderChat)}</SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  )}

                  {sidebarShowDateGroups
                    ? dateGroups.map((group) => (
                        <SidebarGroup key={group.dateKey} className="gap-0.5 p-0">
                          <SidebarStickyGroupLabel>{group.label}</SidebarStickyGroupLabel>
                          <SidebarGroupContent className={SIDEBAR_INSET_CLASS}>
                            <SidebarMenu>{group.chats.map(renderChat)}</SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      ))
                    : flatUnpinned.length > 0 && (
                        <SidebarGroup className="gap-0.5 p-0">
                          {showArchived ? (
                            <SidebarStickyGroupLabel>Archived</SidebarStickyGroupLabel>
                          ) : null}
                          <SidebarGroupContent className={SIDEBAR_INSET_CLASS}>
                            <SidebarMenu>{flatUnpinned.map(renderChat)}</SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      )}
                </>
              )}
            </CustomScrollArea>
          </SidebarContent>

          <SidebarArchiveBar
            showArchived={showArchived}
            onToggle={() => setShowArchived((value) => !value)}
          />
        </>
      )}

      <SidebarUserFooter insetClassName={SIDEBAR_INSET_CLASS} />
    </Sidebar>
  )
}
