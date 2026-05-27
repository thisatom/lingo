import type { StreamingSentenceTts } from '@/features/text-to-speech/model/streamingSentenceTts'
import { isViewingChat, setPipelineStageForChat } from '@/features/ai-chat/lib/pipeline-stage'

export const STREAMING_TTS_FINISH_MS = 120_000

export async function waitStreamingTtsFinish(tts: StreamingSentenceTts): Promise<void> {
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    tts.cancel()
  }, STREAMING_TTS_FINISH_MS)
  try {
    await tts.finish()
  } finally {
    clearTimeout(timer)
    if (timedOut) tts.cancel()
  }
}

export function playbackErrorMessage(playError: unknown): string {
  const playMsg = playError instanceof Error ? playError.message : 'PLAYBACK_FAILED'
  if (playMsg.includes('TTS_EMPTY')) {
    return 'Speech synthesis returned no audio. The text reply is still in the chat.'
  }
  return playMsg.includes('PLAYBACK_FAILED') || playMsg.includes('TTS_')
    ? 'Could not play audio. The assistant reply is shown in the chat.'
    : playMsg
}

export async function finishStreamingTtsPlayback(
  tts: StreamingSentenceTts,
  finalText: string,
  onPlaybackError: (message: string) => void
): Promise<void> {
  if (finalText.trim()) {
    tts.feed(finalText)
  }
  try {
    await waitStreamingTtsFinish(tts)
  } catch (playError) {
    onPlaybackError(playbackErrorMessage(playError))
  }
}

export function finishAgentTurnForChat(
  targetChatId: string,
  agentSpeechMode: boolean,
  onLiveConversationTurnComplete?: () => void
): void {
  setPipelineStageForChat(targetChatId, 'idle')
  if (agentSpeechMode && isViewingChat(targetChatId)) {
    onLiveConversationTurnComplete?.()
  }
}
