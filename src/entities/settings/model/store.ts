import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  isMicNoiseSuppression,
  type MicNoiseSuppression
} from '@/features/speech-to-text/lib/mic-noise-suppression'
import { openRouterConfig } from '@/shared/config/openrouter'
import { isSidebarChatSort, type SidebarChatSort } from '@/shared/lib/chat-sidebar'

export type { MicNoiseSuppression }

export type ChatComposerMode = 'text' | 'conversation'

interface SettingsState {
  practiceLanguage: string
  modelId: string
  displayName: string
  microphoneDeviceId: string
  /** Fallback when the OS rotates device ids between launches. */
  microphoneLabel: string
  /** Pre-Whisper noise suppression strength (Devices settings). */
  micNoiseSuppression: MicNoiseSuppression
  speakerDeviceId: string
  speakerLabel: string
  ttsEnabled: boolean
  chatComposerMode: ChatComposerMode
  webSearchEnabled: boolean
  sidebarShowDateGroups: boolean
  sidebarChatSort: SidebarChatSort
  setPracticeLanguage: (lang: string) => void
  setModelId: (modelId: string) => void
  setDisplayName: (displayName: string) => void
  setMicrophoneDevice: (deviceId: string, label: string) => void
  setMicNoiseSuppression: (level: MicNoiseSuppression) => void
  setSpeakerDevice: (deviceId: string, label: string) => void
  setTtsEnabled: (enabled: boolean) => void
  setChatComposerMode: (mode: ChatComposerMode) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setSidebarShowDateGroups: (show: boolean) => void
  setSidebarChatSort: (sort: SidebarChatSort) => void
}

type PersistedSettings = Pick<
  SettingsState,
  | 'practiceLanguage'
  | 'modelId'
  | 'displayName'
  | 'microphoneDeviceId'
  | 'microphoneLabel'
  | 'micNoiseSuppression'
  | 'speakerDeviceId'
  | 'speakerLabel'
  | 'ttsEnabled'
  | 'chatComposerMode'
  | 'webSearchEnabled'
  | 'sidebarShowDateGroups'
  | 'sidebarChatSort'
>

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      practiceLanguage: 'en',
      modelId: openRouterConfig.defaultModel,
      displayName: 'User',
      microphoneDeviceId: '',
      microphoneLabel: '',
      micNoiseSuppression: 'light',
      speakerDeviceId: '',
      speakerLabel: '',
      ttsEnabled: false,
      chatComposerMode: 'text',
      webSearchEnabled: true,
      sidebarShowDateGroups: true,
      sidebarChatSort: 'updated-desc',
      setPracticeLanguage: (practiceLanguage) => set({ practiceLanguage }),
      setModelId: (modelId) => set({ modelId }),
      setDisplayName: (displayName) => set({ displayName }),
      setMicrophoneDevice: (microphoneDeviceId, microphoneLabel) =>
        set({ microphoneDeviceId, microphoneLabel }),
      setMicNoiseSuppression: (micNoiseSuppression) => set({ micNoiseSuppression }),
      setSpeakerDevice: (speakerDeviceId, speakerLabel) =>
        set({ speakerDeviceId, speakerLabel }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setChatComposerMode: (chatComposerMode) => set({ chatComposerMode }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
      setSidebarShowDateGroups: (sidebarShowDateGroups) => set({ sidebarShowDateGroups }),
      setSidebarChatSort: (sidebarChatSort) => set({ sidebarChatSort })
    }),
    {
      name: 'lingo-settings',
      version: 8,
      partialize: (state): PersistedSettings => ({
        practiceLanguage: state.practiceLanguage,
        modelId: state.modelId,
        displayName: state.displayName,
        microphoneDeviceId: state.microphoneDeviceId,
        microphoneLabel: state.microphoneLabel,
        micNoiseSuppression: state.micNoiseSuppression,
        speakerDeviceId: state.speakerDeviceId,
        speakerLabel: state.speakerLabel,
        ttsEnabled: state.ttsEnabled,
        chatComposerMode: state.chatComposerMode,
        webSearchEnabled: state.webSearchEnabled,
        sidebarShowDateGroups: state.sidebarShowDateGroups,
        sidebarChatSort: state.sidebarChatSort
      }),
      migrate: (persisted, version) => {
        let state = (persisted ?? {}) as Record<string, unknown>
        if (version < 6) {
          state = {
            ...state,
            microphoneLabel: typeof state.microphoneLabel === 'string' ? state.microphoneLabel : '',
            speakerDeviceId: '',
            speakerLabel: ''
          }
        }
        if (version < 7) {
          state = {
            ...state,
            micNoiseSuppression: isMicNoiseSuppression(state.micNoiseSuppression)
              ? state.micNoiseSuppression
              : 'light'
          }
        }
        if (version < 8) {
          state = {
            ...state,
            sidebarChatSort: isSidebarChatSort(state.sidebarChatSort)
              ? state.sidebarChatSort
              : 'updated-desc'
          }
        }
        return state
      },
      merge: (persisted, current) => {
        const saved = persisted as PersistedSettings
        return {
          ...current,
          ...saved,
          micNoiseSuppression: isMicNoiseSuppression(saved.micNoiseSuppression)
            ? saved.micNoiseSuppression
            : current.micNoiseSuppression,
          sidebarChatSort: isSidebarChatSort(saved.sidebarChatSort)
            ? saved.sidebarChatSort
            : current.sidebarChatSort
        }
      }
    }
  )
)
