import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useChatsStore } from '@/entities/chat/model/store'
import { formatWindowTitle } from '@/shared/lib/window-title'

export function useWindowTitle(): void {
  const { pathname } = useLocation()
  const activeChat = useChatsStore((s) => s.getActiveChat())

  useEffect(() => {
    const segment = pathname.startsWith('/settings')
      ? 'Settings'
      : activeChat?.title
    const title = formatWindowTitle(segment)
    const api = (window as Window & { lingo?: { window?: { setTitle: (t: string) => void } } })
      .lingo?.window
    if (api?.setTitle) {
      api.setTitle(title)
    } else {
      document.title = title
    }
  }, [pathname, activeChat?.id, activeChat?.title])
}
