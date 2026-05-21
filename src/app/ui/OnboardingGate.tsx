import { useEffect, useState } from 'react'
import { OnboardingDialog } from '@/features/onboarding/ui/OnboardingDialog'
import { useSettingsStore } from '@/entities/settings/model/store'

/** Shows first-run setup after persisted settings are loaded. */
export function OnboardingGate() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted)
  const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated())
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useSettingsStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  const show = hydrated && !onboardingCompleted && !dismissed

  if (!show) return null

  return (
    <OnboardingDialog
      open
      onCompleted={() => setDismissed(true)}
    />
  )
}
