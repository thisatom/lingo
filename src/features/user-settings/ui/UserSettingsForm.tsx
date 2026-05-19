import { useSettingsStore } from '@/entities/settings/model/store'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { Input } from '@/shared/ui/input'
import { Item, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
export function UserSettingsForm() {
  const displayName = useSettingsStore((s) => s.displayName)
  const setDisplayName = useSettingsStore((s) => s.setDisplayName)

  return (
    <ItemGroup className="gap-4">
      <Item size="sm" className="flex-col items-stretch rounded-[8px] border border-border p-3">
        <ItemContent className="gap-1.5">
          <Label htmlFor="display-name" className="text-xs font-medium">
            Display name
          </Label>
          <Input
            id="display-name"
            className={settingsInputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={64}
          />
          <ItemDescription className="text-xs">
            Shown in the sidebar and across the app.
          </ItemDescription>
        </ItemContent>
      </Item>

    </ItemGroup>
  )
}
