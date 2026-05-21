import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { OpenRouterModelCombobox } from '@/features/manage-api-keys/ui/OpenRouterModelCombobox'
import { PRACTICE_LANGUAGE_OPTIONS } from '@/shared/config/practice-languages'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  settingsInputClass,
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import { applyThemePreference, syncNativeTheme } from '@/shared/lib/theme'
import { APP_THEME_OPTIONS } from '@/shared/lib/theme-options'
import type { AppTheme } from '@/shared/types/app-theme'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/ui/dialog'
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

type OnboardingDialogProps = {
  open: boolean
  onCompleted: () => void
}

function Field({
  id,
  label,
  hint,
  children
}: {
  id: string
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function OnboardingDialog({ open, onCompleted }: OnboardingDialogProps) {
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted)
  const setDisplayName = useSettingsStore((s) => s.setDisplayName)
  const setAppTheme = useSettingsStore((s) => s.setAppTheme)
  const setPracticeLanguage = useSettingsStore((s) => s.setPracticeLanguage)
  const setModelId = useSettingsStore((s) => s.setModelId)
  const setAddressUserByName = useSettingsStore((s) => s.setAddressUserByName)

  const [displayName, setDisplayNameLocal] = useState(
    () => useSettingsStore.getState().displayName
  )
  const [appTheme, setAppThemeLocal] = useState<AppTheme>(
    () => useSettingsStore.getState().appTheme
  )
  const [practiceLanguage, setPracticeLanguageLocal] = useState(
    () => useSettingsStore.getState().practiceLanguage
  )
  const [modelId, setModelIdLocal] = useState(() => useSettingsStore.getState().modelId)
  const [addressByName, setAddressByName] = useState(
    () => useSettingsStore.getState().addressUserByName
  )
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const languageOptions = useMemo(() => {
    if (
      practiceLanguage &&
      !PRACTICE_LANGUAGE_OPTIONS.some((o) => o.value === practiceLanguage)
    ) {
      return [
        { value: practiceLanguage, label: `${practiceLanguage} (current)` },
        ...PRACTICE_LANGUAGE_OPTIONS
      ]
    }
    return PRACTICE_LANGUAGE_OPTIONS
  }, [practiceLanguage])

  useEffect(() => {
    if (!open) return
    const resolved = applyThemePreference(appTheme)
    syncNativeTheme(resolved)
  }, [appTheme, open])

  const persistSettings = () => {
    const name = displayName.trim() || 'User'
    setDisplayName(name)
    setAppTheme(appTheme)
    setPracticeLanguage(practiceLanguage)
    setModelId(modelId)
    setAddressUserByName(addressByName)
  }

  const finish = async (skipApiKey = false) => {
    const name = displayName.trim()
    if (!name) {
      setError('Enter your name to continue.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      persistSettings()

      if (!skipApiKey && apiKey.trim().length > 0) {
        if (!isLingoAvailable()) {
          setError('Desktop API unavailable. Run the app with npm run dev.')
          return
        }
        await getLingo().secrets.set('openrouter', apiKey.trim())
        const result = await getLingo().secrets.validateOpenRouter()
        if (!result.ok) {
          setError(result.error ?? 'OpenRouter key validation failed.')
          return
        }
      }

      setOnboardingCompleted(true)
      onCompleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save setup.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(90vh,720px)] overflow-y-auto border-border bg-background sm:max-w-lg"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to Lingo</DialogTitle>
          <DialogDescription>
            Set up your profile, appearance, and OpenRouter connection. You can change
            everything later in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <Field id="onboarding-name" label="Your name" hint="Shown in the sidebar and chats.">
            <Input
              id="onboarding-name"
              className={cn(settingsInputClass, 'w-full')}
              value={displayName}
              onChange={(e) => setDisplayNameLocal(e.target.value)}
              placeholder="How should we call you?"
              maxLength={64}
              autoFocus
            />
          </Field>

          <Field id="onboarding-theme" label="Theme">
            <Select
              value={appTheme}
              onValueChange={(value) => {
                const option = APP_THEME_OPTIONS.find((o) => o.value === value)
                if (option) setAppThemeLocal(option.value)
              }}
            >
              <SelectTrigger
                id="onboarding-theme"
                size="sm"
                className={cn(settingsSelectTriggerClass, 'w-full')}
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
          </Field>

          <Field
            id="onboarding-lang"
            label="Practice language"
            hint="Used for speech recognition and AI replies."
          >
            <Select value={practiceLanguage} onValueChange={setPracticeLanguageLocal}>
              <SelectTrigger
                id="onboarding-lang"
                size="sm"
                className={cn(settingsSelectTriggerClass, 'w-full')}
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
                {languageOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={settingsSelectItemClass}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 dark:border-[#242424] dark:bg-[#1c1c1c]">
            <div className="min-w-0">
              <p className="text-sm text-foreground">Address me by name</p>
              <p className="text-xs text-muted-foreground">
                The assistant will use your name in replies.
              </p>
            </div>
            <Switch
              id="onboarding-address-by-name"
              checked={addressByName}
              onCheckedChange={setAddressByName}
            />
          </div>

          <Field
            id="onboarding-api-key"
            label="OpenRouter API key"
            hint="Required for AI chat. Get a key at openrouter.ai — you can add it later in Settings."
          >
            <Input
              id="onboarding-api-key"
              type="password"
              className={cn(settingsInputClass, 'w-full')}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-…"
              autoComplete="off"
            />
          </Field>

          <Field
            id="onboarding-model"
            label="OpenRouter model"
            hint="Default model for new chats."
          >
            <OpenRouterModelCombobox
              id="onboarding-model"
              value={modelId}
              onChange={setModelIdLocal}
              className="w-full"
            />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void finish(true)}
          >
            Skip API key
          </Button>
          <Button type="button" disabled={busy} onClick={() => void finish(false)}>
            {busy ? 'Saving…' : 'Get started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
