import type { ReactNode } from 'react'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'

export function ContextMenuShortcut({ children }: { children: ReactNode }) {
  return (
    <span className="ml-auto flex items-center gap-1 pl-4 text-muted-foreground">{children}</span>
  )
}

export function CtrlCShortcut() {
  return (
    <ContextMenuShortcut>
      <KbdGroup aria-hidden>
        <Kbd>Ctrl</Kbd>
        <Kbd>C</Kbd>
      </KbdGroup>
    </ContextMenuShortcut>
  )
}

export function CtrlAShortcut() {
  return (
    <ContextMenuShortcut>
      <KbdGroup aria-hidden>
        <Kbd>Ctrl</Kbd>
        <Kbd>A</Kbd>
      </KbdGroup>
    </ContextMenuShortcut>
  )
}
