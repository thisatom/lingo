import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { openRouterConfig } from '@/shared/config/openrouter'

interface SettingsState {
  practiceLanguage: string
  modelId: string
  displayName: string
  microphoneDeviceId: string
  ttsEnabled: boolean
  sidebarShowDateGroups: boolean
  setPracticeLanguage: (lang: string) => void
  setModelId: (modelId: string) => void
  setDisplayName: (displayName: string) => void
  setMicrophoneDeviceId: (deviceId: string) => void
  setTtsEnabled: (enabled: boolean) => void
  setSidebarShowDateGroups: (show: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      practiceLanguage: 'en',
      modelId: openRouterConfig.defaultModel,
      displayName: 'User',
      microphoneDeviceId: '',
      ttsEnabled: false,
      sidebarShowDateGroups: true,
      setPracticeLanguage: (practiceLanguage) => set({ practiceLanguage }),
      setModelId: (modelId) => set({ modelId }),
      setDisplayName: (displayName) => set({ displayName }),
      setMicrophoneDeviceId: (microphoneDeviceId) => set({ microphoneDeviceId }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setSidebarShowDateGroups: (sidebarShowDateGroups) => set({ sidebarShowDateGroups })
    }),
    {
      name: 'lingo-settings',
      version: 2,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        microphoneDeviceId:
          (persisted as SettingsState | undefined)?.microphoneDeviceId ?? '',
        sidebarShowDateGroups:
          (persisted as SettingsState | undefined)?.sidebarShowDateGroups ?? true
      })
    }
  )
)
