import { useMemo } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsSubsectionTitleClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass
} from '@/shared/lib/settings-surface'
import { PRACTICE_LANGUAGE_OPTIONS } from '@/shared/config/practice-languages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'

export function PracticeSettingsForm() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const setPracticeLanguage = useSettingsStore((s) => s.setPracticeLanguage)

  const options = useMemo(() => {
    if (practiceLanguage && !PRACTICE_LANGUAGE_OPTIONS.some((o) => o.value === practiceLanguage)) {
      return [
        { value: practiceLanguage, label: `${practiceLanguage} (current)` },
        ...PRACTICE_LANGUAGE_OPTIONS
      ]
    }
    return PRACTICE_LANGUAGE_OPTIONS
  }, [practiceLanguage])

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>Practice</h2>
      <p className={settingsSubsectionTitleClass}>Language</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Practice language</p>
            <p className={settingsRowDescriptionClass}>Used for speech recognition and AI replies.</p>
          </div>
          <Select value={practiceLanguage} onValueChange={setPracticeLanguage}>
            <SelectTrigger
              id="lang"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={settingsSelectItemClass}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}
