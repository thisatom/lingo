import { useMemo } from 'react'
import { useAudioLevelMonitor } from '@/features/audio-devices/model/useAudioLevelMonitor'
import { MicLevelVisualizer } from '@/features/audio-devices/ui/MicLevelVisualizer'
import { cn } from '@/shared/lib/utils'

const BAR_COUNT = 10

interface ComposerMicLevelProps {
  active: boolean
  deviceId?: string
  deviceLabel?: string
  stream?: MediaStream | null
  className?: string
}

export function ComposerMicLevel({
  active,
  deviceId = '',
  deviceLabel = '',
  stream = null,
  className
}: ComposerMicLevelProps) {
  const { levels, isReceiving } = useAudioLevelMonitor({
    active,
    deviceId,
    deviceLabel,
    stream
  })

  const compactLevels = useMemo(() => {
    if (levels.length <= BAR_COUNT) return levels
    const step = levels.length / BAR_COUNT
    return Array.from({ length: BAR_COUNT }, (_, i) => levels[Math.floor(i * step)] ?? 0)
  }, [levels])

  const displayLevels = useMemo(() => {
    if (active) return compactLevels
    return Array(BAR_COUNT).fill(0.12)
  }, [active, compactLevels])

  return (
    <MicLevelVisualizer
      levels={displayLevels}
      isReceiving={active && isReceiving}
      maxBarHeight={10}
      className={cn('w-[52px] shrink-0', className)}
    />
  )
}
