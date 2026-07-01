import { useEffect } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { chatRoutePath } from '@/features/chat/lib/chat-route'
import { invokeShortcutHandler } from '@/features/keyboard-shortcuts/model/shortcut-handlers'
import { useSettingsStore } from '@/entities/settings/model/store'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import {
  isArchiveChatShortcut,
  isChatSearchShortcut,
  isComposerModeConversationShortcut,
  isComposerModeTextShortcut,
  isNewChatShortcut,
  isOpenSettingsShortcut,
  isSettingsSearchShortcut,
  isSidebarToggleShortcut,
  isStopAgentShortcut,
  isVoiceInputShortcut
} from '@/shared/lib/keyboard-shortcuts/match'
import { lingoToast } from '@/shared/ui/lingo-toast'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function isDialogTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('[role="dialog"], [role="alertdialog"]'))
}

export interface GlobalKeyboardShortcutsOptions {
  isSettingsRoute: boolean
  openChatSearch: () => void
  openSettingsSearch: () => void
  toggleSidebarPanel: () => void
  navigate: NavigateFunction
}

export function useGlobalKeyboardShortcuts({
  isSettingsRoute,
  openChatSearch,
  openSettingsSearch,
  toggleSidebarPanel,
  navigate
}: GlobalKeyboardShortcutsOptions): void {
  useEffect(() => {
    const runNewChat = () => {
      const id = useChatsStore.getState().createChat()
      navigate(chatRoutePath(id))
    }

    const runArchiveActiveChat = () => {
      if (isSettingsRoute) return
      const active = useChatsStore.getState().getActiveChat()
      if (!active || active.archived) return
      useChatsStore.getState().archiveChat(active.id)
      lingoToast.message('Chat archived', { description: active.title })
    }

    const setComposerMode = (mode: ChatComposerMode) => {
      useSettingsStore.getState().setChatComposerMode(mode)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      const inEditable = isEditableTarget(event.target)
      const inDialog = isDialogTarget(event.target)

      if (isNewChatShortcut(event)) {
        if (inEditable || inDialog) return
        event.preventDefault()
        event.stopPropagation()
        runNewChat()
        return
      }

      if (isSettingsRoute ? isSettingsSearchShortcut(event) : isChatSearchShortcut(event)) {
        if (inDialog) return
        event.preventDefault()
        event.stopPropagation()
        if (isSettingsRoute) openSettingsSearch()
        else openChatSearch()
        return
      }

      if (isOpenSettingsShortcut(event)) {
        if (inDialog) return
        event.preventDefault()
        event.stopPropagation()
        if (!isSettingsRoute) navigate('/settings/general')
        return
      }

      if (isSidebarToggleShortcut(event)) {
        if (inEditable || inDialog) return
        event.preventDefault()
        event.stopPropagation()
        toggleSidebarPanel()
        return
      }

      if (isArchiveChatShortcut(event)) {
        if (inEditable || inDialog || isSettingsRoute) return
        event.preventDefault()
        event.stopPropagation()
        runArchiveActiveChat()
        return
      }

      if (isComposerModeTextShortcut(event) || isComposerModeConversationShortcut(event)) {
        if (inEditable || inDialog) return
        event.preventDefault()
        setComposerMode(isComposerModeTextShortcut(event) ? 'text' : 'conversation')
        return
      }

      if (isVoiceInputShortcut(event)) {
        if (inDialog) return
        event.preventDefault()
        event.stopPropagation()
        invokeShortcutHandler('voiceInput')
        return
      }

      if (isStopAgentShortcut(event)) {
        if (inDialog) return
        event.preventDefault()
        event.stopPropagation()
        invokeShortcutHandler('stopAgent')
        return
      }
    }

    window.addEventListener('keydown', onKeyDown, true)

    const offNative = (
      window as Window & {
        lingo?: { shortcuts?: { onNewChat: (h: () => void) => () => void } }
      }
    ).lingo?.shortcuts?.onNewChat(runNewChat)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      offNative?.()
    }
  }, [
    isSettingsRoute,
    navigate,
    openChatSearch,
    openSettingsSearch,
    toggleSidebarPanel
  ])
}
