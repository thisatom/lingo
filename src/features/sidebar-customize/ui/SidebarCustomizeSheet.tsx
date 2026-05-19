import { useSettingsStore } from '@/entities/settings/model/store'
import { Label } from '@/shared/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/shared/ui/sheet'

interface SidebarCustomizeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SidebarCustomizeSheet({ open, onOpenChange }: SidebarCustomizeSheetProps) {
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups)
  const setSidebarShowDateGroups = useSettingsStore((s) => s.setSidebarShowDateGroups)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] border-border bg-sidebar">
        <SheetHeader>
          <SheetTitle>Customize sidebar</SheetTitle>
          <SheetDescription>Adjust how your chat list appears.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-1">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border accent-foreground"
              checked={sidebarShowDateGroups}
              onChange={(e) => setSidebarShowDateGroups(e.target.checked)}
            />
            <span className="space-y-1">
              <Label className="cursor-pointer text-sm font-medium text-foreground">
                Group chats by date
              </Label>
              <span className="block text-xs text-muted-foreground">
                Show section headers with your system date format (e.g. 19 мая 2026).
              </span>
            </span>
          </label>
        </div>
      </SheetContent>
    </Sheet>
  )
}
