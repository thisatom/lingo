import { useEffect, useMemo, useState } from 'react'
import { completeOnboarding } from '@/features/onboarding/lib/complete-onboarding'
import { OpenRouterModelCombobox } from '@/features/manage-api-keys/ui/OpenRouterModelCombobox'
import { PRACTICE_LANGUAGE_OPTIONS } from '@/shared/config/practice-languages'
import { useSettingsStore } from '@/entities/settings/model/store'
import { flushSettingsPersist } from '@/app/lib/flush-settings-persist'
import { SETTINGS_STORAGE_KEY } from '@/shared/lib/needs-welcome-window'
import { finishWelcomeWindow } from '@/shared/lib/welcome-window'
import { isElectronApp } from '@/shared/lib/lingo'
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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Spinner } from '@/shared/ui/spinner'
import { getTtsPreviewPhrase } from '@/shared/lib/tts-preview'

const STEPS = [
  { id: 'hello', title: 'Welcome' },
  { id: 'look', title: 'Appearance' },
  { id: 'speak', title: 'Language' },
  { id: 'key', title: 'API key' }
] as const

type StepId = (typeof STEPS)[number]['id']

export function WelcomePage() {
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated())
  const [stepIndex, setStepIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState(() => useSettingsStore.getState().displayName)
  const [appTheme, setAppTheme] = useState<AppTheme>(() => useSettingsStore.getState().appTheme)
  const [practiceLanguage, setPracticeLanguage] = useState(
    () => useSettingsStore.getState().practiceLanguage
  )
  const [modelId, setModelId] = useState(() => useSettingsStore.getState().modelId)
  const [addressByName, setAddressByName] = useState(
    () => useSettingsStore.getState().addressUserByName
  )
  const [apiKey, setApiKey] = useState('')

  const step = STEPS[stepIndex]!.id
  const previewPhrase = useMemo(
    () => getTtsPreviewPhrase(practiceLanguage),
    [practiceLanguage]
  )

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!useSettingsStore.getState().onboardingCompleted) return
    // Skip only when onboarding was already saved (re-open), not fresh migrate defaults.
    try {
      if (localStorage.getItem(SETTINGS_STORAGE_KEY) == null) return
    } catch {
      return
    }
    void finishWelcomeWindow()
  }, [hydrated])

  useEffect(() => {
    const resolved = applyThemePreference(appTheme)
    syncNativeTheme(resolved)
  }, [appTheme])

  useEffect(() => {
    const flushOnClose = () => {
      void flushSettingsPersist()
    }
    window.addEventListener('beforeunload', flushOnClose)
    return () => window.removeEventListener('beforeunload', flushOnClose)
  }, [])

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

  const goNext = () => {
    setError(null)
    if (step === 'hello' && !displayName.trim()) {
      setError('Enter your name to continue.')
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setError(null)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const launch = async (skipApiKey = false) => {
    setBusy(true)
    setError(null)
    const result = await completeOnboarding(
      {
        displayName,
        appTheme,
        practiceLanguage,
        modelId,
        addressUserByName: addressByName,
        apiKey
      },
      { skipApiKey }
    )
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await finishWelcomeWindow()
  }

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="./icon.png" alt="" className="size-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold tracking-tight">Lingo</h1>
            <p className="text-xs text-muted-foreground">
              {isElectronApp() ? 'Set up before your first chat' : 'Welcome'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                index <= stepIndex ? 'bg-primary' : 'bg-muted'
              )}
              aria-label={item.title}
              onClick={() => {
                if (index < stepIndex) setStepIndex(index)
              }}
            />
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {step === 'hello' && (
          <section className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Hi there</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Practice conversation in any language with voice, text, and AI feedback.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="welcome-name">Your name</Label>
              <Input
                id="welcome-name"
                className={cn(settingsInputClass, 'w-full')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                maxLength={64}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goNext()
                }}
              />
              <p className="text-xs text-muted-foreground">Shown in the sidebar and chats.</p>
            </div>
          </section>
        )}

        {step === 'look' && (
          <section className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Pick a look</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theme applies instantly — try light or dark.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {APP_THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                    appTheme === option.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  onClick={() => setAppTheme(option.value)}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                checked={addressByName}
                onChange={(e) => setAddressByName(e.target.checked)}
              />
              Address me by name in replies
            </label>
          </section>
        )}

        {step === 'speak' && (
          <section className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Practice language</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Used for speech recognition, AI replies, and voice preview.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageOptions.slice(0, 12).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    practiceLanguage === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  onClick={() => setPracticeLanguage(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Preview phrase: <span className="text-foreground">{previewPhrase}</span>
            </p>
          </section>
        )}

        {step === 'key' && (
          <section className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">OpenRouter</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your API key now or skip and paste it later in Settings → API.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="welcome-api-key">API key</Label>
              <Input
                id="welcome-api-key"
                type="password"
                className={cn(settingsInputClass, 'w-full font-mono text-xs')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-…"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Model</Label>
              <OpenRouterModelCombobox value={modelId} onChange={setModelId} />
            </div>
          </section>
        )}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </main>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
        <Button type="button" variant="ghost" size="sm" disabled={stepIndex === 0 || busy} onClick={goBack}>
          Back
        </Button>
        <div className="flex gap-2">
          {step === 'key' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void launch(true)}
              >
                Skip for now
              </Button>
              <Button type="button" size="sm" disabled={busy} onClick={() => void launch(false)}>
                {busy ? 'Starting…' : 'Open Lingo'}
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" disabled={busy} onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
