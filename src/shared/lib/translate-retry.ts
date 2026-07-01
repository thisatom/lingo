const RETRYABLE = /fetch|network|timeout|429|too many|econnreset|503|502|403|aborted|socket|rate/i

export function isRetryableTranslateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return RETRYABLE.test(message)
}

export async function withTranslateRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isLast = attempt >= attempts - 1
      if (isLast || !isRetryableTranslateError(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
    }
  }

  throw lastError
}
