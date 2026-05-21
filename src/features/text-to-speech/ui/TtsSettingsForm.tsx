import { useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import {
  playTtsFromBase64,
  stopTtsPlayback
} from '@/features/text-to-speech/model/playTts'
import { TTS_VOICE_AUTO, getTtsVoiceOptionsForLanguage } from '@/shared/config/tts-voices'
import { getLingo, isLingoAvailable } from '@/shared/lib/lingo'
import {
  settingsSelectContentClass,
  settingsSelectItemClass,
  settingsSelectTriggerClass
} from '@/shared/lib/settings-control'
import {
  settingsCardClass,
  settingsRowClass,
  settingsRowDescriptionClass,
  settingsSubsectionTitleClass,
  settingsRowTextWrapClass,
  settingsRowTitleClass,
  settingsSectionTitleClass
} from '@/shared/lib/settings-surface'
import { buildTtsSynthesizeRequest } from '@/shared/lib/tts-synthesize-options'
import { getTtsPreviewPhrase } from '@/shared/lib/tts-preview'
import { TTS_SPEECH_RATE_OPTIONS } from '@/shared/lib/tts-rate'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'

export function TtsSettingsForm() {
  const practiceLanguage = useSettingsStore((s) => s.practiceLanguage)
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled)
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled)
  const ttsSpeechRate = useSettingsStore((s) => s.ttsSpeechRate)
  const setTtsSpeechRate = useSettingsStore((s) => s.setTtsSpeechRate)
  const ttsVoiceId = useSettingsStore((s) => s.ttsVoiceId)
  const setTtsVoiceId = useSettingsStore((s) => s.setTtsVoiceId)

  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [previewError, setPreviewError] = useState<string | null>(null)

  const voiceOptions = useMemo(
    () => getTtsVoiceOptionsForLanguage(practiceLanguage),
    [practiceLanguage]
  )

  const voiceSelectValue =
    ttsVoiceId &&
    ttsVoiceId !== '' &&
    voiceOptions.some((o) => o.id === ttsVoiceId)
      ? ttsVoiceId
      : TTS_VOICE_AUTO

  useEffect(() => {
    if (!ttsVoiceId || ttsVoiceId === '' || ttsVoiceId === TTS_VOICE_AUTO) return
    if (voiceOptions.some((o) => o.id === ttsVoiceId)) return
    setTtsVoiceId(TTS_VOICE_AUTO)
  }, [practiceLanguage, ttsVoiceId, voiceOptions, setTtsVoiceId])

  const rateDescription =
    TTS_SPEECH_RATE_OPTIONS.find((o) => o.value === ttsSpeechRate)?.description ??
    'Speech speed for assistant replies.'

  async function playPreview() {
    if (!isLingoAvailable()) {
      setPreviewError('Voice preview is only available in the desktop app.')
      return
    }
    setPreviewError(null)
    setPreviewState('loading')
    stopTtsPlayback()
    try {
      const phrase = getTtsPreviewPhrase(practiceLanguage)
      const result = await getLingo().tts.synthesize(
        buildTtsSynthesizeRequest(phrase, practiceLanguage)
      )
      setPreviewState('playing')
      await playTtsFromBase64(result.audioBase64, result.mimeType)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Preview failed'
      setPreviewError(msg.includes('TTS_') ? 'Could not synthesize preview audio.' : msg)
    } finally {
      setPreviewState('idle')
    }
  }

  return (
    <section>
      <h2 className={settingsSectionTitleClass}>Speech</h2>
      <p className={settingsSubsectionTitleClass}>Assistant voice</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Speak replies</p>
            <p className={settingsRowDescriptionClass}>
              Plays AI answers aloud in Agent Speech (live conversation) mode.
            </p>
          </div>
          <Switch
            checked={ttsEnabled}
            onCheckedChange={(checked) => setTtsEnabled(Boolean(checked))}
            aria-label="Speak assistant replies"
          />
        </div>

        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Speech rate</p>
            <p className={settingsRowDescriptionClass}>{rateDescription}</p>
          </div>
          <Select
            value={ttsSpeechRate}
            onValueChange={(value) => {
              const option = TTS_SPEECH_RATE_OPTIONS.find((o) => o.value === value)
              if (option) setTtsSpeechRate(option.value)
            }}
            disabled={!ttsEnabled}
          >
            <SelectTrigger
              id="speech-rate"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {TTS_SPEECH_RATE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={settingsSelectItemClass}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Voice</p>
            <p className={settingsRowDescriptionClass}>
              Automatic uses a neural voice matching your practice language (
              {practiceLanguage.toUpperCase()}).
            </p>
          </div>
          <Select
            value={voiceSelectValue}
            onValueChange={(value) => setTtsVoiceId(value)}
            disabled={!ttsEnabled}
          >
            <SelectTrigger
              id="speech-voice"
              size="sm"
              className={`${settingsSelectTriggerClass} w-[220px] min-w-0`}
            >
              <SelectValue placeholder="Automatic" />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {voiceOptions.map((option) => (
                <SelectItem
                  key={option.id === TTS_VOICE_AUTO ? 'auto' : option.id}
                  value={option.id}
                  className={settingsSelectItemClass}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Preview</p>
      <div className={settingsCardClass}>
        <div className="px-4 py-3">
          <p className={settingsRowTitleClass}>Test voice</p>
          <p className={settingsRowDescriptionClass}>
            Hear a short sample with your current rate and voice settings. Output uses the
            speaker selected under Devices.
          </p>
          {previewError && (
            <p className="mt-2 text-[11px] text-destructive">{previewError}</p>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              className="h-6 px-2 text-[11px]"
              disabled={!ttsEnabled || previewState !== 'idle'}
              onClick={() => void playPreview()}
            >
              {previewState === 'loading'
                ? 'Loading…'
                : previewState === 'playing'
                  ? 'Playing…'
                  : 'Play sample'}
            </Button>
            {previewState !== 'idle' && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="h-6 px-2 text-[11px]"
                onClick={() => {
                  stopTtsPlayback()
                  setPreviewState('idle')
                }}
              >
                Stop
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
