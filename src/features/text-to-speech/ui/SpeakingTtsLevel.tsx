import { useTtsPlaybackLevels } from '@/features/text-to-speech/model/useTtsPlaybackLevels'
import { MicLevelVisualizer } from '@/features/audio-devices/ui/MicLevelVisualizer'

export function SpeakingTtsLevel() {
  const { levels, isPlaying } = useTtsPlaybackLevels()

  return (
    <MicLevelVisualizer
      levels={levels}
      isReceiving={isPlaying}
      maxBarHeight={10}
      className="w-[44px] shrink-0"
    />
  )
}
