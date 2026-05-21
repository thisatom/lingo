import type { ChatStreamEvent } from '../../src/shared/types/ipc'
import { openRouterConfig } from '../../src/shared/config/openrouter'
import { setupTesseractImageOcr } from '../../src/shared/lib/image-ocr-tesseract'
import { setupLocalWebSearch } from '../../src/shared/lib/setup-local-web-search'
import { streamOpenRouterChat } from '../../src/shared/lib/openrouter-chat-stream'
import { getSecret } from './secrets'

setupTesseractImageOcr()
setupLocalWebSearch()

export { normalizeOpenRouterModelId } from '../../src/shared/config/openrouter'

export async function streamChat(
  request: {
    messages: import('../../src/shared/types/ipc').ChatMessagePayload[]
    model?: string
    practiceLanguage?: string
    webSearch?: boolean
  },
  send: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  return streamOpenRouterChat(
    request,
    send,
    () => getSecret('openrouter'),
    { defaultModel: process.env.LINGO_OPENROUTER_MODEL ?? openRouterConfig.defaultModel },
    signal
  )
}
