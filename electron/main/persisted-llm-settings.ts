import type { WebContents } from 'electron'
import { SETTINGS_STORAGE_KEY } from '@/shared/lib/needs-welcome-window'
import type { LlmBackend } from '@/shared/types/ipc'

export type PersistedLlmSnapshot = {
  llmBackend: LlmBackend
  modelId: string
  customApiBaseUrl: string
  customModelId: string
  customLlmProfileJson: string
  webSearchEnabled: boolean
  modelAutoFallback: boolean
  llmMaxTokens: number
}

const READ_LLM_SETTINGS_SCRIPT = `
(() => {
  try {
    const raw = localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = parsed?.state ?? {};
    return {
      llmBackend: s.llmBackend === 'custom' ? 'custom' : 'openrouter',
      modelId: typeof s.modelId === 'string' ? s.modelId : '',
      customApiBaseUrl: typeof s.customApiBaseUrl === 'string' ? s.customApiBaseUrl : '',
      customModelId: typeof s.customModelId === 'string' ? s.customModelId : '',
      customLlmProfileJson: typeof s.customLlmProfileJson === 'string' ? s.customLlmProfileJson : '',
      webSearchEnabled: Boolean(s.webSearchEnabled),
      modelAutoFallback: Boolean(s.modelAutoFallback),
      llmMaxTokens: typeof s.llmMaxTokens === 'number' ? s.llmMaxTokens : 2048
    };
  } catch {
    return null;
  }
})()
`

export async function readPersistedLlmSnapshot(
  webContents: WebContents
): Promise<PersistedLlmSnapshot | null> {
  if (webContents.isDestroyed()) return null
  try {
    return (await webContents.executeJavaScript(READ_LLM_SETTINGS_SCRIPT, true)) as
      | PersistedLlmSnapshot
      | null
  } catch {
    return null
  }
}
