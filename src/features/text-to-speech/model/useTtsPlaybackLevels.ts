import { useEffect, useState } from 'react'
import { subscribeTtsPlaybackMeter } from '@/features/text-to-speech/lib/tts-playback-meter'

const BAR_COUNT = 10

export function useTtsPlaybackLevels() {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.1))
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => subscribeTtsPlaybackMeter((next, playing) => {
    setLevels(next)
    setIsPlaying(playing)
  }), [])

  return { levels, isPlaying }
}
