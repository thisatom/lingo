import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { getShortcutDefinition } from '@/shared/lib/keyboard-shortcuts/definitions'
import {
  bindingFromKeyboardEvent,
  findShortcutConflict
} from '@/shared/lib/keyboard-shortcuts/resolve'
import type { ShortcutId } from '@/shared/lib/keyboard-shortcuts/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { lingoToast } from '@/shared/ui/lingo-toast'
import { ShortcutKeys, useResolvedShortcut } from '@/features/keyboard-shortcuts/ui/ShortcutKeys'

export function ShortcutRecorder({
  shortcutId,
  className
}: {
  shortcutId: ShortcutId
  className?: string
}) {
  const [recording, setRecording] = useState(false)
  const setOverride = useSettingsStore((s) => s.setKeyboardShortcutOverride)
  const shortcut = useResolvedShortcut(shortcutId)
  const hasOverride = Boolean(useSettingsStore((s) => s.keyboardShortcutOverrides[shortcutId]))

  useEffect(() => {
    if (!recording) return

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.code === 'Escape') {
        setRecording(false)
        return
      }

      const binding = bindingFromKeyboardEvent(event)
      if (!binding) return

      const conflict = findShortcutConflict(shortcutId, binding)
      if (conflict) {
        lingoToast.error('Shortcut already in use', {
          description: getShortcutDefinition(conflict).label
        })
        setRecording(false)
        return
      }

      setOverride(shortcutId, binding)
      setRecording(false)
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [recording, setOverride, shortcutId])

  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'h-7 min-w-[5.5rem] px-2',
          recording && 'border-ring ring-2 ring-ring/40'
        )}
        aria-label={recording ? 'Recording shortcut — press keys' : `Change ${shortcut.label} shortcut`}
        onClick={() => setRecording(true)}
        onBlur={() => setRecording(false)}
      >
        {recording ? (
          <span className="text-xs text-muted-foreground">Press keys…</span>
        ) : (
          <ShortcutKeys shortcut={shortcut} className="opacity-100" />
        )}
      </Button>
      {hasOverride ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => setOverride(shortcutId, null)}
        >
          Reset
        </Button>
      ) : null}
    </div>
  )
}
