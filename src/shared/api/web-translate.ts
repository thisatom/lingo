import {
  translateManyWithGoogle,
  translateWithGoogle
} from '@/shared/lib/google-translate-client'
import type {
  TranslateTextBatchRequest,
  TranslateTextBatchResponse,
  TranslateTextRequest,
  TranslateTextResponse
} from '@/shared/types/ipc'

function wrapTranslateError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('TRANSLATE_')) {
    throw error instanceof Error ? error : new Error(message)
  }
  throw new Error(`TRANSLATE_FAILED:${message.slice(0, 200)}`)
}

export async function translateTextWeb(
  request: TranslateTextRequest
): Promise<TranslateTextResponse> {
  try {
    return await translateWithGoogle(request)
  } catch (error) {
    wrapTranslateError(error)
  }
}

export async function translateTextBatchWeb(
  request: TranslateTextBatchRequest
): Promise<TranslateTextBatchResponse> {
  try {
    return await translateManyWithGoogle(request)
  } catch (error) {
    wrapTranslateError(error)
  }
}
