import { useSettingsStore } from '@/entities/settings/model/store'
import { ShortcutRecorder } from '@/features/keyboard-shortcuts/ui/ShortcutRecorder'
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUTS_BY_CATEGORY,
  SHORTCUT_CATEGORY_LABELS
} from '@/shared/lib/keyboard-shortcuts/definitions'
import { displayModKey } from '@/shared/lib/keyboard-shortcuts/format'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowControlClass,
  settingsRowDescriptionClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass,
  settingsSubsectionTitleClass
} from '@/shared/lib/settings-surface'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

export function KeyboardShortcutsSettingsSection() {
  const resetKeyboardShortcuts = useSettingsStore((s) => s.resetKeyboardShortcuts)
  const hasOverrides = useSettingsStore(
    (s) => Object.keys(s.keyboardShortcutOverrides ?? {}).length > 0
  )

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className={cn(settingsSectionTitleClass, 'mb-0')}>Keyboard shortcuts</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasOverrides}
          onClick={resetKeyboardShortcuts}
        >
          Reset to defaults
        </Button>
      </div>

      <p className="mb-4 px-1 text-sm text-muted-foreground">
        {displayModKey()} is the primary modifier on your platform. Click a shortcut to change it;
        press Escape to cancel. Enter sends from the composer; Shift+Enter adds a new line.
      </p>

      {(
        Object.entries(SHORTCUTS_BY_CATEGORY) as Array<
          [keyof typeof SHORTCUTS_BY_CATEGORY, typeof KEYBOARD_SHORTCUTS]
        >
      ).map(([category, shortcuts]) =>
        shortcuts.length === 0 ? null : (
          <div key={category} className="mb-4 last:mb-0">
            <p className={settingsSubsectionTitleClass}>{SHORTCUT_CATEGORY_LABELS[category]}</p>
            <div className={settingsCardClass}>
              {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className={settingsRowClass}>
                  <div className={settingsRowTextWrapClass}>
                    <p className={settingsRowTitleClass}>{shortcut.label}</p>
                    <p className={settingsRowDescriptionClass}>{shortcut.description}</p>
                  </div>
                  <div className={settingsRowControlClass}>
                    <ShortcutRecorder shortcutId={shortcut.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </section>
  )
}
