import { useEffect } from 'react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  isComposerModeConversationShortcut,
  isComposerModeTextShortcut
} from '@/shared/lib/keyboard-shortcut'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function useChatComposerModeHotkey(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      let mode: ChatComposerMode | null = null
      if (isComposerModeTextShortcut(event)) mode = 'text'
      if (isComposerModeConversationShortcut(event)) mode = 'conversation'
      if (!mode) return

      event.preventDefault()
      useSettingsStore.getState().setChatComposerMode(mode)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
