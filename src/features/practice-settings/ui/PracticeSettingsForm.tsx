import { useMemo } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Item, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'

const PRACTICE_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'uk', label: 'Ukrainian' }
]

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
    <ItemGroup className="gap-4">
      <Item size="sm" className="flex-col items-stretch rounded-[8px] border border-border p-3">
        <ItemContent className="gap-1.5">
          <Label htmlFor="lang" className="text-xs font-medium">
            Practice language (ISO)
          </Label>
          <Select value={practiceLanguage} onValueChange={setPracticeLanguage}>
            <SelectTrigger
              id="lang"
              size="sm"
              className={cn(settingsInputClass, 'w-full min-w-0 border-input shadow-none')}
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent position="popper">
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ItemDescription className="text-xs">
            Used for speech recognition and AI replies.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
