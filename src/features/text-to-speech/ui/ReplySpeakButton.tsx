import { useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  playTtsFromBase64,
  stopTtsPlayback
} from '@/features/text-to-speech/model/playTts'
import { resolvePracticeLanguage } from '@/shared/config/practice-languages'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import { buildTtsSynthesizeRequest } from '@/shared/lib/tts-synthesize-options'
import { stripTextForSpeech } from '@/shared/lib/strip-text-for-speech'
import { Loader2Icon, Square, Volume2 } from '@/shared/ui/icons'
import { messageActionButtonClass } from '@/widgets/conversation-panel/ui/agent-layout'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

type Props = {
  content: string
}

export function ReplySpeakButton({ content }: Props) {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')

  const handleSpeak = async () => {
    if (state === 'playing') {
      stopTtsPlayback()
      setState('idle')
      return
    }

    const text = stripTextForSpeech(content).trim()
    if (!text) return
    if (!isLingoAvailable()) return

    setState('loading')
    stopTtsPlayback()

    try {
      const locale = resolvePracticeLanguage(practiceLanguage, { assistantText: text })
      const result = await getLingo().tts.synthesize(
        buildTtsSynthesizeRequest(text, locale)
      )
      setState('playing')
      await playTtsFromBase64(result.audioBase64, result.mimeType)
    } catch {
      // Playback errors are non-fatal for the chat UI.
    } finally {
      setState('idle')
    }
  }

  const tooltip =
    state === 'playing' ? 'Stop' : state === 'loading' ? 'Loading speech…' : 'Speak reply'

  return (
    <TooltipIconButton
      type="button"
      variant="ghost"
      size="icon-xs"
      className={messageActionButtonClass}
      tooltip={tooltip}
      aria-label={tooltip}
      disabled={state === 'loading'}
      onClick={() => void handleSpeak()}
    >
      {state === 'loading' ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : state === 'playing' ? (
        <Square className="size-3.5" />
      ) : (
        <Volume2 className="size-3.5" />
      )}
    </TooltipIconButton>
  )
}
