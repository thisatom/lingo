import type { Page } from '@playwright/test'

export const SETTINGS_STORAGE_KEY = 'lingo-settings'
export const CHATS_STORAGE_KEY = 'lingo-chats-v3'
export const OPENROUTER_SECRET_KEY = 'lingo.secret.openrouter'

const SETTINGS_VERSION = 26
const CHATS_VERSION = 6

export const E2E_CHAT_ID = 'e2e-chat-1'
export const E2E_FAKE_OPENROUTER_KEY = 'sk-e2e-test-key-not-real'

type SeedOptions = {
  displayName?: string
  withChat?: boolean
  withApiKey?: boolean
}

function buildSettingsState(displayName: string) {
  return {
    practiceLanguage: 'en',
    llmBackend: 'openrouter',
    customApiBaseUrl: '',
    customModelId: '',
    customLlmProfileJson: '',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    customModels: [],
    displayName,
    addressUserByName: true,
    microphoneDeviceId: '',
    microphoneLabel: '',
    micNoiseSuppression: true,
    speakerDeviceId: '',
    speakerLabel: '',
    appTheme: 'dark',
    uiFontFamily: 'system',
    uiTextScale: 1,
    chatTextScale: 1,
    codeTextScale: 1,
    thinkingTextScale: 1,
    conversationDensity: 'comfortable',
    reduceUiMotion: false,
    ttsEnabled: false,
    agentSpeechLoopEnabled: false,
    ttsSpeechRate: 'normal',
    ttsVoiceId: 'auto',
    ttsVolume: 1,
    chatComposerMode: 'text',
    webSearchEnabled: false,
    languagePracticeEnabled: true,
    modelAutoFallback: true,
    llmMaxTokens: 4096,
    translationSourceLanguage: 'auto',
    translationTargetLanguage: 'en',
    sidebarShowDateGroups: true,
    sidebarChatSort: 'updated-desc',
    checkpointReturnConfirmEnabled: true,
    onboardingCompleted: true
  }
}

function buildChatsState() {
  const now = Date.now()
  return {
    chats: [
      {
        id: E2E_CHAT_ID,
        title: 'E2E Chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
        pinned: false
      }
    ],
    activeChatId: E2E_CHAT_ID,
    composerDraftByChatId: {},
    composerAttachmentsByChatId: {},
    chatHistoryPast: [],
    chatHistoryFuture: [],
    chatScrollByChatId: {}
  }
}

/** Seed localStorage before the app bootstraps (web preview). */
export async function seedWebAppState(page: Page, options: SeedOptions = {}): Promise<void> {
  const displayName = options.displayName ?? 'E2E User'
  const withChat = options.withChat ?? true
  const withApiKey = options.withApiKey ?? true

  await page.addInitScript(
    ({ settingsKey, chatsKey, secretKey, settingsPayload, chatsPayload, apiKey, includeChat, includeKey }) => {
      localStorage.setItem(settingsKey, JSON.stringify(settingsPayload))
      if (includeChat) {
        localStorage.setItem(chatsKey, JSON.stringify(chatsPayload))
      } else {
        localStorage.removeItem(chatsKey)
      }
      if (includeKey) {
        localStorage.setItem(secretKey, apiKey)
      } else {
        localStorage.removeItem(secretKey)
      }
    },
    {
      settingsKey: SETTINGS_STORAGE_KEY,
      chatsKey: CHATS_STORAGE_KEY,
      secretKey: OPENROUTER_SECRET_KEY,
      settingsPayload: {
        state: buildSettingsState(displayName),
        version: SETTINGS_VERSION
      },
      chatsPayload: {
        state: buildChatsState(),
        version: CHATS_VERSION
      },
      apiKey: E2E_FAKE_OPENROUTER_KEY,
      includeChat: withChat,
      includeKey: withApiKey
    }
  )
}

export async function gotoMainChat(page: Page): Promise<void> {
  await page.goto(`/#/c/${encodeURIComponent(E2E_CHAT_ID)}`)
  await page.getByTestId('chat-composer-input').waitFor({ state: 'visible' })
}
