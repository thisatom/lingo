import { useCallback, useRef, type ReactNode } from 'react'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import {
  sidebarMenuItemClass,
  sidebarMenuSurfaceClass
} from '@/shared/lib/sidebar-filter-menu-styles'
import { cn } from '@/shared/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/shared/ui/context-menu'
import { CtrlAShortcut, CtrlCShortcut } from './ContextMenuShortcut'

interface ChatTextContextMenuProps {
  children: ReactNode
  className?: string
}

export function ChatTextContextMenu({ children, className }: ChatTextContextMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(async () => {
    const selected = window.getSelection()?.toString().trim()
    if (selected) {
      await copyToClipboard(selected)
      return
    }
    const text = containerRef.current?.innerText.trim()
    if (text) await copyToClipboard(text)
  }, [])

  const handleSelectAll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={containerRef} className={cn('min-w-0', className)}>
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn('w-52 p-1', sidebarMenuSurfaceClass)}>
        <ContextMenuItem className={sidebarMenuItemClass} onSelect={() => void handleCopy()}>
          <span className="min-w-0 flex-1">Copy</span>
          <CtrlCShortcut />
        </ContextMenuItem>
        <ContextMenuSeparator className="my-1 bg-border/60" />
        <ContextMenuItem className={sidebarMenuItemClass} onSelect={handleSelectAll}>
          <span className="min-w-0 flex-1">Select All</span>
          <CtrlAShortcut />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
