import { useEffect } from 'react'
import type { ChatComposerMode } from '@/entities/settings/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function useChatComposerModeHotkey(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) return
      if (isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()
      let mode: ChatComposerMode | null = null
      if (key === 't') mode = 'text'
      if (key === 'v') mode = 'conversation'
      if (!mode) return

      event.preventDefault()
      useSettingsStore.getState().setChatComposerMode(mode)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
