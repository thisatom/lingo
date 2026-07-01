import { useMemo } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { resolveShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/resolve'
import { getShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/definitions'
import { formatShortcutDisplayKeys } from '@/shared/lib/keyboard-shortcuts/format'
import type { ShortcutDefinition, ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'
import { cn } from '@/shared/lib/utils'

export function ShortcutKeys({
  shortcut,
  className,
  recording = false
}: {
  shortcut: Pick<ShortcutDefinition, 'displayKeys'>
  className?: string
  recording?: boolean
}) {
  const keys = formatShortcutDisplayKeys(shortcut.displayKeys)
  return (
    <KbdGroup
      className={cn('opacity-95', recording && 'ring-2 ring-ring/70 rounded-sm', className)}
      aria-hidden
    >
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </KbdGroup>
  )
}

export function shortcutTooltip(label: string, shortcut: Pick<ShortcutDefinition, 'displayKeys'>) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{label}</span>
      <ShortcutKeys shortcut={shortcut} />
    </span>
  )
}

export function useResolvedShortcut(id: ShortcutId): ShortcutDefinition {
  const override = useSettingsStore((s) => s.keyboardShortcutOverrides[id])
  return useMemo(
    () => resolveShortcutDefinition(getShortcutDefinition(id), override),
    [id, override]
  )
}

export function shortcutTooltipFor(id: ShortcutId, label: string) {
  return <ShortcutTooltipFor id={id} label={label} />
}

function ShortcutTooltipFor({ id, label }: { id: ShortcutId; label: string }) {
  const shortcut = useResolvedShortcut(id)
  return shortcutTooltip(label, shortcut)
}
