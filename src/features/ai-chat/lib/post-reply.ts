/** Conversation errors that only affect TTS — assistant text is already in chat. */
export function isPlaybackOnlyConversationError(error: string | null): boolean {
  if (!error) return false
  const lower = error.toLowerCase()
  return (
    lower.includes('could not play audio') ||
    lower.includes('speech synthesis returned no audio') ||
    error.includes('PLAYBACK_FAILED') ||
    error.includes('TTS_EMPTY')
  )
}

/** After a successful stream when the user is not on the target chat view. */
export function notViewingPostReplyAction(hasQueued: boolean): 'process-queue' | 'idle' {
  return hasQueued ? 'process-queue' : 'idle'
}
