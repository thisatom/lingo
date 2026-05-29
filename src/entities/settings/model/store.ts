import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  isMicNoiseSuppression,
  type MicNoiseSuppression
} from '@/features/speech-to-text/lib/mic-noise-suppression'
import {
  customLlmConfig,
  isValidCustomApiBaseUrl,
  normalizeCustomApiRootUrl,
  normalizeCustomModelId
} from '@/shared/config/custom-llm'
import {
  defaultCustomLlmProfileJson,
  parseCustomLlmProfileSource,
  profileFromLegacyFields,
  stringifyCustomLlmProfile,
  type ParsedCustomLlmProfile
} from '@/shared/lib/custom-llm-profile'
import { normalizeOpenRouterModelId, openRouterConfig } from '@/shared/config/openrouter'
import type { LlmBackend } from '@/shared/types/ipc'
import {
  filterOpenRouterFreeModels,
  isOpenRouterFreeModel
} from '@/shared/config/openrouter-free-models'
import { TTS_VOICE_AUTO, isKnownTtsVoiceId, normalizeTtsVoiceId } from '@/shared/config/tts-voices'
import { isSidebarChatSort, type SidebarChatSort } from '@/shared/lib/chat-sidebar'
import { LLM_MAX_TOKENS_DEFAULT, normalizeLlmMaxTokens } from '@/shared/lib/llm-max-tokens'
import { isTtsSpeechRate, type TtsSpeechRate } from '@/shared/lib/tts-rate'
import { normalizeTtsVolume, TTS_VOLUME_DEFAULT } from '@/shared/lib/tts-volume'
import { hasPersistedChatsInStorage } from '@/shared/lib/has-persisted-chats'
import { resolveOnboardingCompleted } from '@/shared/lib/onboarding-status'
import {
  DEFAULT_APPEARANCE,
  isConversationDensity,
  isTextScale,
  isUiFontFamily,
  type ConversationDensity,
  type TextScale,
  type UiFontFamily
} from '@/shared/lib/appearance'
import { isAppTheme } from '@/shared/lib/theme'
import type { AppTheme } from '@/shared/types/app-theme'

export type {
  AppTheme,
  ConversationDensity,
  MicNoiseSuppression,
  TextScale,
  TtsSpeechRate,
  UiFontFamily
}

export type ChatComposerMode = 'text' | 'conversation'

export function isLlmBackend(value: unknown): value is LlmBackend {
  return value === 'openrouter' || value === 'custom'
}

interface SettingsState {
  practiceLanguage: string
  llmBackend: LlmBackend
  customApiBaseUrl: string
  customModelId: string
  /** JSON profile editor source (baseURL, model, completion). */
  customLlmProfileJson: string
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
  uiFontFamily: UiFontFamily
  uiTextScale: TextScale
  chatTextScale: TextScale
  codeTextScale: TextScale
  thinkingTextScale: TextScale
  conversationDensity: ConversationDensity
  reduceUiMotion: boolean
  /** Speak assistant replies in Conversation / Agent Speech mode. */
  ttsEnabled: boolean
  ttsSpeechRate: TtsSpeechRate
  /** Edge voice id; empty = automatic from practice language. */
  ttsVoiceId: string
  /** Playback volume for assistant TTS (0–100). */
  ttsVolume: number
  chatComposerMode: ChatComposerMode
  webSearchEnabled: boolean
  /** On API error, try other free OpenRouter models (each at most once). */
  modelAutoFallback: boolean
  /** Max completion tokens (`max_tokens`); `0` = no limit (omit on API). */
  llmMaxTokens: number
  sidebarShowDateGroups: boolean
  sidebarChatSort: SidebarChatSort
  /** Ask before returning to checkpoint edit flow. */
  checkpointReturnConfirmEnabled: boolean
  /** First-run setup wizard completed. */
  onboardingCompleted: boolean
  setPracticeLanguage: (lang: string) => void
  setLlmBackend: (backend: LlmBackend) => void
  setCustomApiBaseUrl: (baseUrl: string) => void
  setCustomModelId: (modelId: string) => void
  setCustomLlmProfileJson: (json: string) => void
  applyParsedCustomLlmProfile: (parsed: ParsedCustomLlmProfile) => void
  setModelId: (modelId: string) => void
  addCustomModel: (modelId: string) => void
  removeCustomModel: (modelId: string) => void
  setDisplayName: (displayName: string) => void
  setAddressUserByName: (enabled: boolean) => void
  setMicrophoneDevice: (deviceId: string, label: string) => void
  setMicNoiseSuppression: (level: MicNoiseSuppression) => void
  setSpeakerDevice: (deviceId: string, label: string) => void
  setAppTheme: (theme: AppTheme) => void
  setUiFontFamily: (font: UiFontFamily) => void
  setUiTextScale: (scale: TextScale) => void
  setChatTextScale: (scale: TextScale) => void
  setCodeTextScale: (scale: TextScale) => void
  setThinkingTextScale: (scale: TextScale) => void
  setConversationDensity: (density: ConversationDensity) => void
  setReduceUiMotion: (enabled: boolean) => void
  setTtsEnabled: (enabled: boolean) => void
  setTtsSpeechRate: (rate: TtsSpeechRate) => void
  setTtsVoiceId: (voiceId: string) => void
  setTtsVolume: (volume: number) => void
  setChatComposerMode: (mode: ChatComposerMode) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setModelAutoFallback: (enabled: boolean) => void
  setLlmMaxTokens: (maxTokens: number) => void
  setSidebarShowDateGroups: (show: boolean) => void
  setSidebarChatSort: (sort: SidebarChatSort) => void
  setCheckpointReturnConfirmEnabled: (enabled: boolean) => void
  setOnboardingCompleted: (completed: boolean) => void
  resetSettings: () => void
}

type PersistedSettings = Pick<
  SettingsState,
  | 'practiceLanguage'
  | 'llmBackend'
  | 'customApiBaseUrl'
  | 'customModelId'
  | 'customLlmProfileJson'
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
  | 'uiFontFamily'
  | 'uiTextScale'
  | 'chatTextScale'
  | 'codeTextScale'
  | 'thinkingTextScale'
  | 'conversationDensity'
  | 'reduceUiMotion'
  | 'ttsEnabled'
  | 'ttsSpeechRate'
  | 'ttsVoiceId'
  | 'ttsVolume'
  | 'chatComposerMode'
  | 'webSearchEnabled'
  | 'modelAutoFallback'
  | 'llmMaxTokens'
  | 'sidebarShowDateGroups'
  | 'sidebarChatSort'
  | 'checkpointReturnConfirmEnabled'
  | 'onboardingCompleted'
>

const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | 'setPracticeLanguage'
  | 'setLlmBackend'
  | 'setCustomApiBaseUrl'
  | 'setCustomModelId'
  | 'setCustomLlmProfileJson'
  | 'applyParsedCustomLlmProfile'
  | 'setModelId'
  | 'addCustomModel'
  | 'removeCustomModel'
  | 'setDisplayName'
  | 'setAddressUserByName'
  | 'setMicrophoneDevice'
  | 'setMicNoiseSuppression'
  | 'setSpeakerDevice'
  | 'setAppTheme'
  | 'setUiFontFamily'
  | 'setUiTextScale'
  | 'setChatTextScale'
  | 'setCodeTextScale'
  | 'setThinkingTextScale'
  | 'setConversationDensity'
  | 'setReduceUiMotion'
  | 'setTtsEnabled'
  | 'setTtsSpeechRate'
  | 'setTtsVoiceId'
  | 'setTtsVolume'
  | 'setChatComposerMode'
  | 'setWebSearchEnabled'
  | 'setModelAutoFallback'
  | 'setLlmMaxTokens'
  | 'setSidebarShowDateGroups'
  | 'setSidebarChatSort'
  | 'setCheckpointReturnConfirmEnabled'
  | 'setOnboardingCompleted'
  | 'resetSettings'
> = {
  practiceLanguage: 'en',
  llmBackend: 'openrouter',
  customApiBaseUrl: customLlmConfig.defaultBaseUrl,
  customModelId: customLlmConfig.defaultModel,
  customLlmProfileJson: defaultCustomLlmProfileJson(),
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
  uiFontFamily: DEFAULT_APPEARANCE.uiFontFamily,
  uiTextScale: DEFAULT_APPEARANCE.uiTextScale,
  chatTextScale: DEFAULT_APPEARANCE.chatTextScale,
  codeTextScale: DEFAULT_APPEARANCE.codeTextScale,
  thinkingTextScale: DEFAULT_APPEARANCE.thinkingTextScale,
  conversationDensity: DEFAULT_APPEARANCE.conversationDensity,
  reduceUiMotion: DEFAULT_APPEARANCE.reduceUiMotion,
  ttsEnabled: true,
  ttsSpeechRate: 'normal',
  ttsVoiceId: TTS_VOICE_AUTO,
  ttsVolume: TTS_VOLUME_DEFAULT,
  chatComposerMode: 'text',
  webSearchEnabled: true,
  modelAutoFallback: true,
  llmMaxTokens: LLM_MAX_TOKENS_DEFAULT,
  sidebarShowDateGroups: true,
  sidebarChatSort: 'updated-desc',
  checkpointReturnConfirmEnabled: true,
  onboardingCompleted: false
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setPracticeLanguage: (practiceLanguage) => set({ practiceLanguage }),
      setLlmBackend: (llmBackend) =>
        set({ llmBackend: isLlmBackend(llmBackend) ? llmBackend : 'openrouter' }),
      setCustomApiBaseUrl: (customApiBaseUrl) => {
        const baseUrl = normalizeCustomApiRootUrl(customApiBaseUrl)
        const model = useSettingsStore.getState().customModelId
        set({
          customApiBaseUrl: baseUrl,
          customLlmProfileJson: stringifyCustomLlmProfile(
            profileFromLegacyFields(baseUrl, model)
          )
        })
      },
      setCustomModelId: (customModelId) => {
        const model = normalizeCustomModelId(customModelId)
        const baseUrl = useSettingsStore.getState().customApiBaseUrl
        set({
          customModelId: model,
          customLlmProfileJson: stringifyCustomLlmProfile(profileFromLegacyFields(baseUrl, model))
        })
      },
      setCustomLlmProfileJson: (customLlmProfileJson) => set({ customLlmProfileJson }),
      applyParsedCustomLlmProfile: (parsed) =>
        set({
          customApiBaseUrl: parsed.baseUrl,
          customModelId: parsed.model,
          customLlmProfileJson: stringifyCustomLlmProfile(parsed.profile)
        }),
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
      setUiFontFamily: (uiFontFamily) =>
        set({ uiFontFamily: isUiFontFamily(uiFontFamily) ? uiFontFamily : 'system' }),
      setUiTextScale: (uiTextScale) =>
        set({ uiTextScale: isTextScale(uiTextScale) ? uiTextScale : 'default' }),
      setChatTextScale: (chatTextScale) =>
        set({ chatTextScale: isTextScale(chatTextScale) ? chatTextScale : 'default' }),
      setCodeTextScale: (codeTextScale) =>
        set({ codeTextScale: isTextScale(codeTextScale) ? codeTextScale : 'default' }),
      setThinkingTextScale: (thinkingTextScale) =>
        set({
          thinkingTextScale: isTextScale(thinkingTextScale) ? thinkingTextScale : 'default'
        }),
      setConversationDensity: (conversationDensity) =>
        set({
          conversationDensity: isConversationDensity(conversationDensity)
            ? conversationDensity
            : 'default'
        }),
      setReduceUiMotion: (reduceUiMotion) => set({ reduceUiMotion: Boolean(reduceUiMotion) }),
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setTtsSpeechRate: (ttsSpeechRate) =>
        set({ ttsSpeechRate: isTtsSpeechRate(ttsSpeechRate) ? ttsSpeechRate : 'normal' }),
      setTtsVoiceId: (ttsVoiceId) =>
        set({
          ttsVoiceId: isKnownTtsVoiceId(ttsVoiceId)
            ? normalizeTtsVoiceId(ttsVoiceId)
            : TTS_VOICE_AUTO
        }),
      setTtsVolume: (ttsVolume) => set({ ttsVolume: normalizeTtsVolume(ttsVolume) }),
      setChatComposerMode: (chatComposerMode) => set({ chatComposerMode }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
      setModelAutoFallback: (modelAutoFallback) => set({ modelAutoFallback }),
      setLlmMaxTokens: (llmMaxTokens) => set({ llmMaxTokens: normalizeLlmMaxTokens(llmMaxTokens) }),
      setSidebarShowDateGroups: (sidebarShowDateGroups) => set({ sidebarShowDateGroups }),
      setSidebarChatSort: (sidebarChatSort) => set({ sidebarChatSort }),
      setCheckpointReturnConfirmEnabled: (checkpointReturnConfirmEnabled) =>
        set({ checkpointReturnConfirmEnabled }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS })
    }),
    {
      name: 'lingo-settings',
      version: 23,
      partialize: (state): PersistedSettings => ({
        practiceLanguage: state.practiceLanguage,
        llmBackend: state.llmBackend,
        customApiBaseUrl: state.customApiBaseUrl,
        customModelId: state.customModelId,
        customLlmProfileJson: state.customLlmProfileJson,
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
        uiFontFamily: state.uiFontFamily,
        uiTextScale: state.uiTextScale,
        chatTextScale: state.chatTextScale,
        codeTextScale: state.codeTextScale,
        thinkingTextScale: state.thinkingTextScale,
        conversationDensity: state.conversationDensity,
        reduceUiMotion: state.reduceUiMotion,
        ttsEnabled: state.ttsEnabled,
        ttsSpeechRate: state.ttsSpeechRate,
        ttsVoiceId: state.ttsVoiceId,
        ttsVolume: state.ttsVolume,
        chatComposerMode: state.chatComposerMode,
        webSearchEnabled: state.webSearchEnabled,
        modelAutoFallback: state.modelAutoFallback,
        llmMaxTokens: state.llmMaxTokens,
        sidebarShowDateGroups: state.sidebarShowDateGroups,
        sidebarChatSort: state.sidebarChatSort,
        checkpointReturnConfirmEnabled: state.checkpointReturnConfirmEnabled,
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
        if (version < 13 && version > 0) {
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
        if (version < 15) {
          state = {
            ...state,
            llmBackend: 'openrouter',
            customApiBaseUrl: customLlmConfig.defaultBaseUrl,
            customModelId: customLlmConfig.defaultModel
          }
        }
        if (version < 17) {
          state = {
            ...state,
            llmMaxTokens: normalizeLlmMaxTokens(state.llmMaxTokens)
          }
        }
        if (version < 18) {
          state = {
            ...state,
            ttsVolume: normalizeTtsVolume(state.ttsVolume)
          }
        }
        if (version < 19) {
          const existingJson =
            typeof state.customLlmProfileJson === 'string' ? state.customLlmProfileJson : ''
          if (existingJson.trim()) {
            const parsed = parseCustomLlmProfileSource(existingJson)
            if (parsed.ok) {
              if (parsed.importedApiKey) {
                queueMicrotask(() => {
                  void (async () => {
                    try {
                      const { getLingo, isElectronApp } = await import('@/shared/lib/lingo')
                      if (isElectronApp()) {
                        await getLingo().secrets.clear('custom-llm')
                      }
                    } catch {
                      // ignore — key may already live only in secure storage
                    }
                  })()
                })
              }
              state = {
                ...state,
                customLlmProfileJson: stringifyCustomLlmProfile(parsed.data.profile)
              }
            }
          }
        }
        if (version < 20) {
          if (hasPersistedChatsInStorage()) {
            state = {
              ...state,
              onboardingCompleted: true
            }
          }
        }
        if (version < 21) {
          state = {
            ...state,
            checkpointReturnConfirmEnabled:
              typeof state.checkpointReturnConfirmEnabled === 'boolean'
                ? state.checkpointReturnConfirmEnabled
                : true
          }
        }
        if (version < 22) {
          state = {
            ...state,
            uiFontFamily: isUiFontFamily(state.uiFontFamily)
              ? state.uiFontFamily
              : DEFAULT_APPEARANCE.uiFontFamily,
            chatTextScale: isTextScale(state.chatTextScale)
              ? state.chatTextScale
              : DEFAULT_APPEARANCE.chatTextScale,
            codeTextScale: isTextScale(state.codeTextScale)
              ? state.codeTextScale
              : DEFAULT_APPEARANCE.codeTextScale
          }
        }
        if (version < 23) {
          state = {
            ...state,
            uiTextScale: isTextScale(state.uiTextScale)
              ? state.uiTextScale
              : DEFAULT_APPEARANCE.uiTextScale,
            thinkingTextScale: isTextScale(state.thinkingTextScale)
              ? state.thinkingTextScale
              : DEFAULT_APPEARANCE.thinkingTextScale,
            conversationDensity: isConversationDensity(state.conversationDensity)
              ? state.conversationDensity
              : DEFAULT_APPEARANCE.conversationDensity,
            reduceUiMotion:
              typeof state.reduceUiMotion === 'boolean'
                ? state.reduceUiMotion
                : DEFAULT_APPEARANCE.reduceUiMotion
          }
        }
        if (version < 16) {
          const baseUrl =
            typeof state.customApiBaseUrl === 'string'
              ? state.customApiBaseUrl
              : customLlmConfig.defaultBaseUrl
          const model =
            typeof state.customModelId === 'string'
              ? state.customModelId
              : customLlmConfig.defaultModel
          const legacyProfile = profileFromLegacyFields(baseUrl, model)
          const existingJson =
            typeof state.customLlmProfileJson === 'string' ? state.customLlmProfileJson : ''
          const parsed = existingJson.trim()
            ? parseCustomLlmProfileSource(existingJson)
            : null
          state = {
            ...state,
            customLlmProfileJson: parsed?.ok
              ? stringifyCustomLlmProfile(parsed.data.profile)
              : stringifyCustomLlmProfile(legacyProfile)
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
          llmBackend: isLlmBackend(saved.llmBackend) ? saved.llmBackend : current.llmBackend,
          customApiBaseUrl:
            typeof saved.customApiBaseUrl === 'string' &&
            isValidCustomApiBaseUrl(saved.customApiBaseUrl)
              ? normalizeCustomApiRootUrl(saved.customApiBaseUrl)
              : current.customApiBaseUrl,
          customModelId:
            typeof saved.customModelId === 'string'
              ? normalizeCustomModelId(saved.customModelId)
              : current.customModelId,
          customLlmProfileJson:
            typeof saved.customLlmProfileJson === 'string' && saved.customLlmProfileJson.trim()
              ? saved.customLlmProfileJson
              : current.customLlmProfileJson,
          modelId:
            typeof saved.modelId === 'string' && isOpenRouterFreeModel(saved.modelId)
              ? normalizeOpenRouterModelId(saved.modelId)
              : current.modelId,
          modelAutoFallback:
            typeof saved.modelAutoFallback === 'boolean'
              ? saved.modelAutoFallback
              : current.modelAutoFallback,
          webSearchEnabled:
            typeof saved.webSearchEnabled === 'boolean'
              ? saved.webSearchEnabled
              : current.webSearchEnabled,
          llmMaxTokens: normalizeLlmMaxTokens(saved.llmMaxTokens ?? current.llmMaxTokens),
          checkpointReturnConfirmEnabled:
            typeof saved.checkpointReturnConfirmEnabled === 'boolean'
              ? saved.checkpointReturnConfirmEnabled
              : current.checkpointReturnConfirmEnabled,
          ttsSpeechRate: isTtsSpeechRate(saved.ttsSpeechRate)
            ? saved.ttsSpeechRate
            : current.ttsSpeechRate,
          ttsVoiceId:
            typeof saved.ttsVoiceId === 'string'
              ? isKnownTtsVoiceId(saved.ttsVoiceId)
                ? normalizeTtsVoiceId(saved.ttsVoiceId)
                : TTS_VOICE_AUTO
              : current.ttsVoiceId,
          ttsVolume: normalizeTtsVolume(saved.ttsVolume ?? current.ttsVolume),
          appTheme: isAppTheme(saved.appTheme) ? saved.appTheme : current.appTheme,
          uiFontFamily: isUiFontFamily(saved.uiFontFamily)
            ? saved.uiFontFamily
            : current.uiFontFamily,
          chatTextScale: isTextScale(saved.chatTextScale)
            ? saved.chatTextScale
            : current.chatTextScale,
          codeTextScale: isTextScale(saved.codeTextScale)
            ? saved.codeTextScale
            : current.codeTextScale,
          uiTextScale: isTextScale(saved.uiTextScale) ? saved.uiTextScale : current.uiTextScale,
          thinkingTextScale: isTextScale(saved.thinkingTextScale)
            ? saved.thinkingTextScale
            : current.thinkingTextScale,
          conversationDensity: isConversationDensity(saved.conversationDensity)
            ? saved.conversationDensity
            : current.conversationDensity,
          reduceUiMotion:
            typeof saved.reduceUiMotion === 'boolean'
              ? saved.reduceUiMotion
              : current.reduceUiMotion,
          onboardingCompleted: resolveOnboardingCompleted(
            typeof saved.onboardingCompleted === 'boolean'
              ? saved.onboardingCompleted
              : undefined,
            current.onboardingCompleted
          )
        }
      }
    }
  )
)
