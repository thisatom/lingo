import { useEffect } from 'react'

export function useChatSearchHotkey(onOpen: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.shiftKey) return
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      event.stopPropagation()
      onOpen()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onOpen])
}
