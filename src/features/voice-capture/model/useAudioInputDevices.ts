import { useCallback, useEffect, useState } from 'react'
import {
  ensureMicrophonePermission,
  formatMicrophoneLabel,
  listAudioInputDevices
} from '@/shared/lib/microphone'

export interface AudioInputOption {
  deviceId: string
  label: string
}

export function useAudioInputDevices() {
  const [devices, setDevices] = useState<AudioInputOption[]>([])
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const granted = await ensureMicrophonePermission()
    setPermissionDenied(!granted)

    const inputs = await listAudioInputDevices()
    setDevices(
      inputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: formatMicrophoneLabel(device, index)
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()

    const media = navigator.mediaDevices
    if (!media?.addEventListener) return

    const onDeviceChange = () => {
      void refresh()
    }
    media.addEventListener('devicechange', onDeviceChange)
    return () => media.removeEventListener('devicechange', onDeviceChange)
  }, [refresh])

  return { devices, permissionDenied, loading, refresh }
}
