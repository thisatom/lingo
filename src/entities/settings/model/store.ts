import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { openRouterConfig } from '@/shared/config/openrouter'

export type ChatComposerMode = 'text' | 'conversation'

interface SettingsState {
  practiceLanguage: string
  modelId: string
  displayName: string
  microphoneDeviceId: string
  /** Fallback when the OS rotates device ids between launches. */
  microphoneLabel: string
  ttsEnabled: boolean
  chatComposerMode: ChatComposerMode
  webSearchEnabled: boolean
  sidebarShowDateGroups: boolean
  setPracticeLanguage: (lang: string) => void
  setModelId: (modelId: string) => void
  setDisplayName: (displayName: string) => void
  setMicrophoneDevice: (deviceId: string, label: string) => void
  setTtsEnabled: (enabled: boolean) => void
  setChatComposerMode: (mode: ChatComposerMode) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setSidebarShowDateGroups: (show: boolean) => void
}

type PersistedSettings = Pick<
  SettingsState,
  | 'practiceLanguage'
  | 'modelId'
  | 'displayName'
  | 'microphoneDeviceId'
  | 'microphoneLabel'
  | 'ttsEnabled'
  | 'chatComposerMode'
  | 'webSearchEnabled'
  | 'sidebarShowDateGroups'
>

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      practiceLanguage: 'en',
      modelId: openRouterConfig.defaultModel,
      displayName: 'User',
      microphoneDeviceId: '',
      microphoneLabel: '',
      ttsEnabled: false,
      chatComposerMode: 'text',
      webSearchEnabled: true,
      sidebarShowDateGroups: true,
      setPracticeLanguage: (practiceLanguage) => set({ practiceLanguage }),
      setModelId: (modelId) => set({ modelId }),
      setDisplayName: (displayName) => set({ displayName }),
      setMicrophoneDevice: (microphoneDeviceId, microphoneLabel) =>
        set({ microphoneDeviceId, microphoneLabel }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setChatComposerMode: (chatComposerMode) => set({ chatComposerMode }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
      setSidebarShowDateGroups: (sidebarShowDateGroups) => set({ sidebarShowDateGroups })
    }),
    {
      name: 'lingo-settings',
      version: 5,
      partialize: (state): PersistedSettings => ({
        practiceLanguage: state.practiceLanguage,
        modelId: state.modelId,
        displayName: state.displayName,
        microphoneDeviceId: state.microphoneDeviceId,
        microphoneLabel: state.microphoneLabel,
        ttsEnabled: state.ttsEnabled,
        chatComposerMode: state.chatComposerMode,
        webSearchEnabled: state.webSearchEnabled,
        sidebarShowDateGroups: state.sidebarShowDateGroups
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>
        if (version < 5) {
          return {
            ...state,
            microphoneLabel: ''
          }
        }
        return state
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as PersistedSettings)
      })
    }
  )
)
