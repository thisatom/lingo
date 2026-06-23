import type { TranslateTextRequest, TranslateTextResponse } from '../../src/shared/types/ipc'
import { translateWithGoogle } from '../../src/shared/lib/google-translate-client'

export async function translateText(
  request: TranslateTextRequest
): Promise<TranslateTextResponse> {
  try {
    return await translateWithGoogle(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('TRANSLATE_')) throw error instanceof Error ? error : new Error(message)
    throw new Error(`TRANSLATE_FAILED:${message.slice(0, 200)}`)
  }
}
