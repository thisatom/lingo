import { useState } from 'react'
import { useChatsStore } from '@/entities/chat/model/store'
import { useSettingsStore } from '@/entities/settings/model/store'
import { AppUpdateSettingsSection } from '@/features/app-update/ui/AppUpdateSettingsSection'
import { clearAppDataAndPersist } from '@/features/user-settings/lib/clear-app-data'
import { SIDEBAR_CHAT_SORT_OPTIONS, type SidebarChatSort } from '@/shared/lib/chat-sidebar'
import { settingsInputClass } from '@/shared/lib/settings-control'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsSubsectionTitleClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass
} from '@/shared/lib/settings-surface'
import { cn } from '@/shared/lib/utils'
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

const CLEAR_APP_DATA_CONFIRM_TEXT = 'Confirm'

const SIDEBAR_GROUP_OPTIONS = [
  { value: 'date', label: 'By last updated' },
  { value: 'flat', label: 'Flat list' }
] as const

export function UserSettingsForm() {
  const displayName = useSettingsStore((s) => s.displayName)
  const setDisplayName = useSettingsStore((s) => s.setDisplayName)
  const sidebarShowDateGroups = useSettingsStore((s) => s.sidebarShowDateGroups)
  const setSidebarShowDateGroups = useSettingsStore((s) => s.setSidebarShowDateGroups)
  const sidebarChatSort = useSettingsStore((s) => s.sidebarChatSort)
  const setSidebarChatSort = useSettingsStore((s) => s.setSidebarChatSort)
  const resortChats = useChatsStore((s) => s.resortChats)

  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [clearConfirmInput, setClearConfirmInput] = useState('')
  const canClearAppData = clearConfirmInput.trim() === CLEAR_APP_DATA_CONFIRM_TEXT

  const handleClearAppData = async () => {
    await clearAppDataAndPersist()
    setClearConfirmInput('')
    setClearDialogOpen(false)
  }

  const applyChatSort = (sort: SidebarChatSort) => {
    setSidebarChatSort(sort)
    resortChats()
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

      <p className={settingsSubsectionTitleClass}>Sidebar</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Sort chats by</p>
            <p className={settingsRowDescriptionClass}>
              Order of conversations in the chat list.
            </p>
          </div>
          <Select value={sidebarChatSort} onValueChange={(value) => applyChatSort(value as SidebarChatSort)}>
            <SelectTrigger
              id="sidebar-chat-sort"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {SIDEBAR_CHAT_SORT_OPTIONS.map((option) => (
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
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Chat list layout</p>
            <p className={settingsRowDescriptionClass}>
              Group chats into date sections or show one continuous list.
            </p>
          </div>
          <Select
            value={sidebarShowDateGroups ? 'date' : 'flat'}
            onValueChange={(value) => setSidebarShowDateGroups(value === 'date')}
          >
            <SelectTrigger
              id="sidebar-chat-groups"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {SIDEBAR_GROUP_OPTIONS.map((option) => (
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

      <AppUpdateSettingsSection />

      <p className={settingsSubsectionTitleClass}>Privacy &amp; data</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Clear app data</p>
            <p className={settingsRowDescriptionClass}>
              Removes all chats and resets settings to defaults. API keys in the system keychain
              are cleared when available.
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
