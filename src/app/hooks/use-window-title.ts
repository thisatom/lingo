import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { formatWindowTitle } from '@/shared/lib/window-title'

export function useWindowTitle(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = formatWindowTitle(
      pathname.startsWith('/settings') ? 'settings' : 'default'
    )
    const api = (window as Window & { lingo?: { window?: { setTitle: (t: string) => void } } })
      .lingo?.window
    if (api?.setTitle) {
      api.setTitle(title)
    } else {
      document.title = title
    }
  }, [pathname])
}
