import { useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useChatsStore } from '@/entities/chat/model/store'
import { clearAllWebSecrets } from '@/shared/api/browser-lingo'
import { getLingo, isElectronApp, isLingoAvailable } from '@/shared/lib/lingo'
import { isWebPlatform } from '@/shared/lib/lingo-bridge'
import { settingsInputClass } from '@/shared/lib/settings-control'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsSubsectionTitleClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass
} from '@/shared/lib/settings-surface'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { APP_THEME_OPTIONS } from '@/shared/lib/theme-options'
import { AppUpdateSettingsSection } from '@/features/app-update/ui/AppUpdateSettingsSection'

const CLEAR_APP_DATA_CONFIRM_TEXT = 'Confirm'

export function UserSettingsForm() {
  const displayName = useSettingsStore((s) => s.displayName)
  const setDisplayName = useSettingsStore((s) => s.setDisplayName)
  const addressUserByName = useSettingsStore((s) => s.addressUserByName)
  const setAddressUserByName = useSettingsStore((s) => s.setAddressUserByName)
  const appTheme = useSettingsStore((s) => s.appTheme)
  const setAppTheme = useSettingsStore((s) => s.setAppTheme)
  const resetSettings = useSettingsStore((s) => s.resetSettings)
  const resetChats = useChatsStore((s) => s.resetChats)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [clearConfirmInput, setClearConfirmInput] = useState('')
  const canClearAppData = clearConfirmInput.trim() === CLEAR_APP_DATA_CONFIRM_TEXT

  const handleClearAppData = async () => {
    resetChats()
    resetSettings()
    if (isWebPlatform()) {
      clearAllWebSecrets()
    } else if (isElectronApp() && isLingoAvailable()) {
      try {
        await Promise.allSettled([
          getLingo().secrets.clear('openrouter'),
          getLingo().secrets.clear('openai'),
          getLingo().secrets.clear('anthropic'),
          getLingo().secrets.clear('google'),
          getLingo().secrets.clear('groq'),
          getLingo().secrets.clear('azure-speech')
        ])
      } catch {
        // ignore — keytar may be unavailable
      }
    }
    setClearConfirmInput('')
    setClearDialogOpen(false)
  }

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>General</h2>

      <p className={settingsSubsectionTitleClass}>Profile</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Display name</p>
            <p className={settingsRowDescriptionClass}>Shown in the sidebar and across the app.</p>
          </div>
          <Input
            id="display-name"
            className={`${settingsInputClass} w-[220px]`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={64}
          />
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Appearance</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Theme</p>
            <p className={settingsRowDescriptionClass}>
              Light, dark, or follow your system setting.
            </p>
          </div>
          <Select
            value={appTheme}
            onValueChange={(value) => {
              const option = APP_THEME_OPTIONS.find((o) => o.value === value)
              if (option) setAppTheme(option.value)
            }}
          >
            <SelectTrigger
              id="app-theme"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {APP_THEME_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={settingsSelectItemClass}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Personalization</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Address me by name</p>
            <p className={settingsRowDescriptionClass}>
              Adds a hidden instruction so the assistant uses your display name.
            </p>
          </div>
          <Switch
            checked={addressUserByName}
            onCheckedChange={(checked) => setAddressUserByName(Boolean(checked))}
            aria-label="Address by name"
          />
        </div>
      </div>

      <AppUpdateSettingsSection />

      <p className={settingsSubsectionTitleClass}>User data</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Clear app data</p>
            <p className={settingsRowDescriptionClass}>
              Clears local chats and resets settings to defaults.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            className="h-6 px-2 text-[11px]"
            onClick={() => setClearDialogOpen(true)}
          >
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog
        open={clearDialogOpen}
        onOpenChange={(open) => {
          setClearDialogOpen(open)
          if (!open) setClearConfirmInput('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="sm:text-left">
            <AlertDialogTitle>Clear app data?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all chats and resets settings to defaults. API keys stored in the
              system keychain are cleared when available. Type{' '}
              <span className="font-medium text-foreground">{CLEAR_APP_DATA_CONFIRM_TEXT}</span> to
              continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="clear-app-data-confirm" className="text-xs text-muted-foreground">
              Confirmation
            </Label>
            <Input
              id="clear-app-data-confirm"
              className={cn(settingsInputClass, '!h-7 dark:!h-7')}
              value={clearConfirmInput}
              onChange={(e) => setClearConfirmInput(e.target.value)}
              placeholder={CLEAR_APP_DATA_CONFIRM_TEXT}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <AlertDialogCancel size="sm" className="min-w-[5.5rem]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="sm"
              variant="destructive"
              className="min-w-[5.5rem]"
              disabled={!canClearAppData}
              onClick={(e) => {
                e.preventDefault()
                if (!canClearAppData) return
                void handleClearAppData()
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
