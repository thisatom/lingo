export function isOpenRouterCreditError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('more credits') ||
    m.includes('can only afford') ||
    (m.includes('insufficient') && m.includes('credit')) ||
    m.includes('payment required') ||
    m.includes('$0.50')
  )
}

export function formatOpenRouterError(message: string): string {
  if (isOpenRouterCreditError(message)) {
    return 'Not enough OpenRouter credits for this request. Add credits at openrouter.ai/settings/credits, or turn off web search and try again.'
  }
  return message
}
