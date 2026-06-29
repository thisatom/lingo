export function getSpeechContentKey(text: string): string {
  return text.trim()
}

const spokenReplyKeys = new Set<string>()

export function hasSpokenReply(text: string): boolean {
  const key = getSpeechContentKey(text)
  return key.length > 0 && spokenReplyKeys.has(key)
}

export function markReplySpoken(text: string): void {
  const key = getSpeechContentKey(text)
  if (key) spokenReplyKeys.add(key)
}

export function clearSpokenReplyCache(): void {
  spokenReplyKeys.clear()
}
