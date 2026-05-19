import { useSettingsStore } from '@/entities/settings/model/store'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { Input } from '@/shared/ui/input'
import { Item, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'

export function PracticeSettingsForm() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const setPracticeLanguage = useSettingsStore((s) => s.setPracticeLanguage)

  return (
    <ItemGroup className="gap-4">
      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-1.5">
          <Label htmlFor="lang" className="text-xs font-medium">
            Practice language (ISO)
          </Label>
          <Input
            id="lang"
            className={settingsInputClass}
            value={practiceLanguage}
            onChange={(e) => setPracticeLanguage(e.target.value)}
            placeholder="en"
          />
          <ItemDescription className="text-xs">
            Used for speech recognition and AI replies.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
