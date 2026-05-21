import { useEffect } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  applyThemePreference,
  syncNativeTheme,
  type AppTheme
} from '@/shared/lib/theme'

export function useThemeSync(): void {
  const appTheme = useSettingsStore((s) => s.appTheme)

  useEffect(() => {
    const resolved = applyThemePreference(appTheme)
    syncNativeTheme(resolved)
  }, [appTheme])

  useEffect(() => {
    if (appTheme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = applyThemePreference('system' satisfies AppTheme)
      syncNativeTheme(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [appTheme])
}
