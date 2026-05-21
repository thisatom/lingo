import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  isMicNoiseSuppression,
  type MicNoiseSuppression
} from '@/features/speech-to-text/lib/mic-noise-suppression'
import { normalizeOpenRouterModelId, openRouterConfig } from '@/shared/config/openrouter'
import {
  filterOpenRouterFreeModels,
  isOpenRouterFreeModel
} from '@/shared/config/openrouter-free-models'
import { TTS_VOICE_AUTO, isKnownTtsVoiceId, normalizeTtsVoiceId } from '@/shared/config/tts-voices'
import { isSidebarChatSort, type SidebarChatSort } from '@/shared/lib/chat-sidebar'
import { isTtsSpeechRate, type TtsSpeechRate } from '@/shared/lib/tts-rate'
import { isAppTheme } from '@/shared/lib/theme'
import type { AppTheme } from '@/shared/types/app-theme'

export type { AppTheme, MicNoiseSuppression, TtsSpeechRate }

export type ChatComposerMode = 'text' | 'conversation'

interface SettingsState {
  practiceLanguage: string
  modelId: string
  /** User-saved OpenRouter model ids (persisted). */
  customModels: string[]
  displayName: string
  /** Add a hidden system instruction: address the user by name. */
  addressUserByName: boolean
  microphoneDeviceId: string
  /** Fallback when the OS rotates device ids between launches. */
  microphoneLabel: string
  /** Pre-Whisper noise suppression strength (Devices settings). */
  micNoiseSuppression: MicNoiseSuppression
  speakerDeviceId: string
  speakerLabel: string
  appTheme: AppTheme
  /** Speak assistant replies in Conversation / Agent Speech mode. */
  ttsEnabled: boolean
  ttsSpeechRate: TtsSpeechRate
  /** Edge voice id; empty = automatic from practice language. */
  ttsVoiceId: string
  chatComposerMode: ChatComposerMode
  webSearchEnabled: boolean
  /** On API error, try other free OpenRouter models (each at most once). */
  modelAutoFallback: boolean
  sidebarShowDateGroups: boolean
  sidebarChatSort: SidebarChatSort
  /** First-run setup wizard completed. */
  onboardingCompleted: boolean
  setPracticeLanguage: (lang: string) => void
  setModelId: (modelId: string) => void
  addCustomModel: (modelId: string) => void
  removeCustomModel: (modelId: string) => void
  setDisplayName: (displayName: string) => void
  setAddressUserByName: (enabled: boolean) => void
  setMicrophoneDevice: (deviceId: string, label: string) => void
  setMicNoiseSuppression: (level: MicNoiseSuppression) => void
  setSpeakerDevice: (deviceId: string, label: string) => void
  setAppTheme: (theme: AppTheme) => void
  setTtsEnabled: (enabled: boolean) => void
  setTtsSpeechRate: (rate: TtsSpeechRate) => void
  setTtsVoiceId: (voiceId: string) => void
  setChatComposerMode: (mode: ChatComposerMode) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setModelAutoFallback: (enabled: boolean) => void
  setSidebarShowDateGroups: (show: boolean) => void
  setSidebarChatSort: (sort: SidebarChatSort) => void
  setOnboardingCompleted: (completed: boolean) => void
  resetSettings: () => void
}

type PersistedSettings = Pick<
  SettingsState,
  | 'practiceLanguage'
  | 'modelId'
  | 'customModels'
  | 'displayName'
  | 'addressUserByName'
  | 'microphoneDeviceId'
  | 'microphoneLabel'
  | 'micNoiseSuppression'
  | 'speakerDeviceId'
  | 'speakerLabel'
  | 'appTheme'
  | 'ttsEnabled'
  | 'ttsSpeechRate'
  | 'ttsVoiceId'
  | 'chatComposerMode'
  | 'webSearchEnabled'
  | 'modelAutoFallback'
  | 'sidebarShowDateGroups'
  | 'sidebarChatSort'
  | 'onboardingCompleted'
>

const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | 'setPracticeLanguage'
  | 'setModelId'
  | 'addCustomModel'
  | 'removeCustomModel'
  | 'setDisplayName'
  | 'setAddressUserByName'
  | 'setMicrophoneDevice'
  | 'setMicNoiseSuppression'
  | 'setSpeakerDevice'
  | 'setAppTheme'
  | 'setTtsEnabled'
  | 'setTtsSpeechRate'
  | 'setTtsVoiceId'
  | 'setChatComposerMode'
  | 'setWebSearchEnabled'
  | 'setModelAutoFallback'
  | 'setSidebarShowDateGroups'
  | 'setSidebarChatSort'
  | 'setOnboardingCompleted'
  | 'resetSettings'
> = {
  practiceLanguage: 'en',
  modelId: openRouterConfig.defaultModel,
  customModels: [],
  displayName: 'User',
  addressUserByName: false,
  microphoneDeviceId: '',
  microphoneLabel: '',
  micNoiseSuppression: 'light',
  speakerDeviceId: '',
  speakerLabel: '',
  appTheme: 'dark',
  ttsEnabled: true,
  ttsSpeechRate: 'normal',
  ttsVoiceId: TTS_VOICE_AUTO,
  chatComposerMode: 'text',
  webSearchEnabled: true,
  modelAutoFallback: true,
  sidebarShowDateGroups: true,
  sidebarChatSort: 'updated-desc',
  onboardingCompleted: false
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setPracticeLanguage: (practiceLanguage) => set({ practiceLanguage }),
      setModelId: (modelId) => {
        const id = normalizeOpenRouterModelId(modelId)
        if (!id || !isOpenRouterFreeModel(id)) return
        set({ modelId: id })
      },
      addCustomModel: (modelId) => {
        const id = normalizeOpenRouterModelId(modelId)
        if (!id || !isOpenRouterFreeModel(id)) return
        const key = id.toLowerCase()
        set((state) => {
          const list = state.customModels ?? []
          if (list.some((m) => normalizeOpenRouterModelId(m).toLowerCase() === key)) {
            return state
          }
          return { customModels: [id, ...list] }
        })
      },
      removeCustomModel: (modelId) => {
        const key = normalizeOpenRouterModelId(modelId).toLowerCase()
        if (!key) return
        set((state) => ({
          customModels: (state.customModels ?? []).filter(
            (m) => normalizeOpenRouterModelId(m).toLowerCase() !== key
          )
        }))
      },
      setDisplayName: (displayName) => set({ displayName }),
      setAddressUserByName: (addressUserByName) => set({ addressUserByName }),
      setMicrophoneDevice: (microphoneDeviceId, microphoneLabel) =>
        set({ microphoneDeviceId, microphoneLabel }),
      setMicNoiseSuppression: (micNoiseSuppression) => set({ micNoiseSuppression }),
      setSpeakerDevice: (speakerDeviceId, speakerLabel) =>
        set({ speakerDeviceId, speakerLabel }),
      setAppTheme: (appTheme) =>
        set({ appTheme: isAppTheme(appTheme) ? appTheme : 'dark' }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setTtsSpeechRate: (ttsSpeechRate) =>
        set({ ttsSpeechRate: isTtsSpeechRate(ttsSpeechRate) ? ttsSpeechRate : 'normal' }),
      setTtsVoiceId: (ttsVoiceId) =>
        set({
          ttsVoiceId: isKnownTtsVoiceId(ttsVoiceId)
            ? normalizeTtsVoiceId(ttsVoiceId)
            : TTS_VOICE_AUTO
        }),
      setChatComposerMode: (chatComposerMode) => set({ chatComposerMode }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
      setModelAutoFallback: (modelAutoFallback) => set({ modelAutoFallback }),
      setSidebarShowDateGroups: (sidebarShowDateGroups) => set({ sidebarShowDateGroups }),
      setSidebarChatSort: (sidebarChatSort) => set({ sidebarChatSort }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS })
    }),
    {
      name: 'lingo-settings',
      version: 14,
      partialize: (state): PersistedSettings => ({
        practiceLanguage: state.practiceLanguage,
        modelId: state.modelId,
        customModels: state.customModels ?? [],
        displayName: state.displayName,
        addressUserByName: state.addressUserByName,
        microphoneDeviceId: state.microphoneDeviceId,
        microphoneLabel: state.microphoneLabel,
        micNoiseSuppression: state.micNoiseSuppression,
        speakerDeviceId: state.speakerDeviceId,
        speakerLabel: state.speakerLabel,
        appTheme: state.appTheme,
        ttsEnabled: state.ttsEnabled,
        ttsSpeechRate: state.ttsSpeechRate,
        ttsVoiceId: state.ttsVoiceId,
        chatComposerMode: state.chatComposerMode,
        webSearchEnabled: state.webSearchEnabled,
        modelAutoFallback: state.modelAutoFallback,
        sidebarShowDateGroups: state.sidebarShowDateGroups,
        sidebarChatSort: state.sidebarChatSort,
        onboardingCompleted: state.onboardingCompleted
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
        if (version < 9) {
          state = {
            ...state,
            addressUserByName:
              typeof state.addressUserByName === 'boolean' ? state.addressUserByName : false
          }
        }
        if (version < 10) {
          state = {
            ...state,
            customModels: Array.isArray(state.customModels)
              ? (state.customModels as string[]).filter((m) => typeof m === 'string')
              : []
          }
        }
        if (version < 11) {
          state = {
            ...state,
            ttsSpeechRate: isTtsSpeechRate(state.ttsSpeechRate) ? state.ttsSpeechRate : 'normal',
            ttsVoiceId:
              typeof state.ttsVoiceId === 'string'
                ? normalizeTtsVoiceId(state.ttsVoiceId)
                : TTS_VOICE_AUTO
          }
        }
        if (version < 12) {
          state = {
            ...state,
            appTheme: isAppTheme(state.appTheme) ? state.appTheme : 'dark'
          }
        }
        if (version < 13) {
          state = {
            ...state,
            onboardingCompleted: true
          }
        }
        if (version < 14) {
          const modelId =
            typeof state.modelId === 'string' && isOpenRouterFreeModel(state.modelId)
              ? normalizeOpenRouterModelId(state.modelId)
              : openRouterConfig.defaultModel
          state = {
            ...state,
            modelId,
            modelAutoFallback: true,
            customModels: filterOpenRouterFreeModels(
              Array.isArray(state.customModels) ? (state.customModels as string[]) : []
            )
          }
        }
        return state
      },
      merge: (persisted, current) => {
        const saved = persisted as PersistedSettings
        return {
          ...current,
          ...saved,
          addressUserByName:
            typeof saved.addressUserByName === 'boolean'
              ? saved.addressUserByName
              : current.addressUserByName,
          micNoiseSuppression: isMicNoiseSuppression(saved.micNoiseSuppression)
            ? saved.micNoiseSuppression
            : current.micNoiseSuppression,
          sidebarChatSort: isSidebarChatSort(saved.sidebarChatSort)
            ? saved.sidebarChatSort
            : current.sidebarChatSort,
          customModels: filterOpenRouterFreeModels(
            Array.isArray(saved.customModels) ? saved.customModels : current.customModels
          ),
          modelId:
            typeof saved.modelId === 'string' && isOpenRouterFreeModel(saved.modelId)
              ? normalizeOpenRouterModelId(saved.modelId)
              : current.modelId,
          modelAutoFallback:
            typeof saved.modelAutoFallback === 'boolean'
              ? saved.modelAutoFallback
              : current.modelAutoFallback,
          ttsSpeechRate: isTtsSpeechRate(saved.ttsSpeechRate)
            ? saved.ttsSpeechRate
            : current.ttsSpeechRate,
          ttsVoiceId:
            typeof saved.ttsVoiceId === 'string'
              ? isKnownTtsVoiceId(saved.ttsVoiceId)
                ? normalizeTtsVoiceId(saved.ttsVoiceId)
                : TTS_VOICE_AUTO
              : current.ttsVoiceId,
          appTheme: isAppTheme(saved.appTheme) ? saved.appTheme : current.appTheme,
          onboardingCompleted:
            typeof saved.onboardingCompleted === 'boolean'
              ? saved.onboardingCompleted
              : current.onboardingCompleted
        }
      }
    }
  )
)
