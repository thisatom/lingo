import { useCallback, useEffect, useState } from 'react'
import { ensureMicrophonePermission } from '@/shared/lib/microphone'
import {
  formatSpeakerLabel,
  isAudioOutputSelectionSupported,
  listAudioOutputDevices
} from '@/shared/lib/audio-output'

export interface AudioOutputOption {
  deviceId: string
  label: string
}

export function useAudioOutputDevices() {
  const [devices, setDevices] = useState<AudioOutputOption[]>([])
  const [loading, setLoading] = useState(true)
  const [sinkSupported] = useState(isAudioOutputSelectionSupported)

  const refresh = useCallback(async () => {
    setLoading(true)
    await ensureMicrophonePermission()
    const outputs = await listAudioOutputDevices()
    setDevices(
      outputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: formatSpeakerLabel(device, index)
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const media = navigator.mediaDevices
    if (!media?.addEventListener) return
    const onDeviceChange = () => void refresh()
    media.addEventListener('devicechange', onDeviceChange)
    return () => media.removeEventListener('devicechange', onDeviceChange)
  }, [refresh])

  return { devices, loading, refresh, sinkSupported }
}
