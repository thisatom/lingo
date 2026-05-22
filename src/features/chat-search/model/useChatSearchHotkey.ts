import { useEffect } from 'react'
import { isChatSearchShortcut } from '@/shared/lib/keyboard-shortcut'

export function useChatSearchHotkey(onOpen: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isChatSearchShortcut(event)) return
      event.preventDefault()
      event.stopPropagation()
      onOpen()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onOpen])
}
