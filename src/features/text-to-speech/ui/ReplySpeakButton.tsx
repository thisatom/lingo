import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { subscribeTtsPlaybackMeter } from '@/features/text-to-speech/lib/tts-playback-meter'
import {
  getSpeechContentKey,
  hasSpokenReply,
  markReplySpoken
} from '@/features/text-to-speech/lib/spoken-reply-cache'
import {
  playTtsFromBase64,
  stopTtsPlayback
} from '@/features/text-to-speech/model/playTts'
import { resolvePracticeLanguage } from '@/shared/config/practice-languages'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { buildTtsSynthesizeRequest } from '@/shared/lib/tts-synthesize-options'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'
import { Square, Volume2 } from '@/shared/ui/icons'
import { Spinner } from '@/shared/ui/spinner'
import { messageActionButtonClass } from '@/widgets/conversation-panel/ui/agent-layout'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  content: string
}

type SpeakPhase = 'idle' | 'loading' | 'playing'

export function ReplySpeakButton({ content }: Props) {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const speechText = useMemo(() => stripTextForSpeech(content).trim(), [content])
  const speechKey = useMemo(() => getSpeechContentKey(speechText), [speechText])
  const [phase, setPhase] = useState<SpeakPhase>('idle')
  const [hovered, setHovered] = useState(false)
  const [spoken, setSpoken] = useState(() => hasSpokenReply(speechKey))
  const ownsPlaybackRef = useRef(false)

  useEffect(() => {
    setSpoken(hasSpokenReply(speechKey))
    setPhase('idle')
    ownsPlaybackRef.current = false
  }, [speechKey])

  useEffect(() => {
    return subscribeTtsPlaybackMeter((_levels, isPlaying) => {
      if (!ownsPlaybackRef.current) return
      if (isPlaying) return
      ownsPlaybackRef.current = false
      markReplySpoken(speechKey)
      setSpoken(true)
      setPhase('idle')
    })
  }, [speechKey])

  const handleSpeak = useCallback(async () => {
    if (!speechText || !isLingoAvailable()) return
    if (spoken && phase === 'idle') return

    if (phase === 'playing') {
      stopTtsPlayback()
      ownsPlaybackRef.current = false
      setPhase('idle')
      return
    }

    if (phase === 'loading') {
      stopTtsPlayback()
      ownsPlaybackRef.current = false
      setPhase('idle')
      return
    }

    setPhase('loading')
    stopTtsPlayback()

    try {
      const locale = resolvePracticeLanguage(practiceLanguage, { assistantText: speechText })
      const result = await getLingo().tts.synthesize(buildTtsSynthesizeRequest(speechText, locale))
      ownsPlaybackRef.current = true
      setPhase('playing')
      await playTtsFromBase64(result.audioBase64, result.mimeType)
      if (ownsPlaybackRef.current) {
        ownsPlaybackRef.current = false
        markReplySpoken(speechKey)
        setSpoken(true)
        setPhase('idle')
      }
    } catch {
      ownsPlaybackRef.current = false
      setPhase('idle')
    }
  }, [phase, practiceLanguage, speechKey, speechText, spoken])

  const tooltip =
    spoken && phase === 'idle'
      ? 'Already spoken'
      : phase === 'playing'
        ? 'Stop'
        : phase === 'loading'
          ? 'Loading speech…'
          : 'Speak reply'

  const showStop = phase === 'playing' && hovered
  const showSpinner = phase === 'loading' || (phase === 'playing' && !hovered)

  return (
    <TooltipIconButton
      type="button"
      variant="ghost"
      size="icon-xs"
      className={messageActionButtonClass}
      tooltip={tooltip}
      aria-label={tooltip}
      disabled={spoken && phase === 'idle'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => void handleSpeak()}
    >
      {showStop ? (
        <Square className="size-3.5" />
      ) : showSpinner ? (
        <Spinner size="sm" />
      ) : (
        <Volume2 className={spoken ? 'size-3.5 opacity-45' : 'size-3.5'} />
      )}
    </TooltipIconButton>
  )
}
