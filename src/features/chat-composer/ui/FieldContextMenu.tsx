import { useCallback, useRef, type ReactNode } from 'react'
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
import {
  CtrlAShortcut,
  CtrlCShortcut,
  CtrlVShortcut,
  CtrlXShortcut
} from '@/widgets/conversation-panel/ui/chat-context-menu/ContextMenuShortcut'

export type EditableFieldElement = HTMLTextAreaElement | HTMLInputElement

interface FieldContextMenuProps {
  children: ReactNode
  onValueChange: (value: string) => void
  fieldRef: React.RefObject<EditableFieldElement | null>
}

/** Cut / copy / paste / select-all for textarea and text inputs. */
export function FieldContextMenu({ children, onValueChange, fieldRef }: FieldContextMenuProps) {
  const syncingRef = useRef(false)

  const syncFromField = useCallback(() => {
    const el = fieldRef.current
    if (!el || syncingRef.current) return
    onValueChange(el.value)
  }, [fieldRef, onValueChange])

  const runCommand = useCallback(
    (command: 'cut' | 'copy') => {
      const el = fieldRef.current
      if (!el) return
      el.focus()
      document.execCommand(command)
      syncFromField()
    },
    [fieldRef, syncFromField]
  )

  const handlePaste = useCallback(async () => {
    const el = fieldRef.current
    if (!el) return
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      el.focus()
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? el.value.length
      const next = el.value.slice(0, start) + text + el.value.slice(end)
      syncingRef.current = true
      onValueChange(next)
      syncingRef.current = false
      const caret = start + text.length
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(caret, caret)
      })
    } catch {
      // Clipboard denied or unavailable
    }
  }, [fieldRef, onValueChange])

  const handleSelectAll = useCallback(() => {
    const el = fieldRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [fieldRef])

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div className="block min-w-0 w-full">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn('w-52', sidebarMenuSurfaceClass)}>
        <ContextMenuItem className={sidebarMenuItemClass} onSelect={() => runCommand('cut')}>
          <span className="min-w-0 flex-1">Cut</span>
          <CtrlXShortcut />
        </ContextMenuItem>
        <ContextMenuItem className={sidebarMenuItemClass} onSelect={() => runCommand('copy')}>
          <span className="min-w-0 flex-1">Copy</span>
          <CtrlCShortcut />
        </ContextMenuItem>
        <ContextMenuItem
          className={sidebarMenuItemClass}
          onSelect={() => void handlePaste()}
        >
          <span className="min-w-0 flex-1">Paste</span>
          <CtrlVShortcut />
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-border/60" />
        <ContextMenuItem className={sidebarMenuItemClass} onSelect={handleSelectAll}>
          <span className="min-w-0 flex-1">Select All</span>
          <CtrlAShortcut />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** @deprecated Use {@link FieldContextMenu} */
export function ComposerTextareaContextMenu({
  children,
  onValueChange,
  textareaRef
}: {
  children: ReactNode
  onValueChange: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  return (
    <FieldContextMenu fieldRef={textareaRef} onValueChange={onValueChange}>
      {children}
    </FieldContextMenu>
  )
}
