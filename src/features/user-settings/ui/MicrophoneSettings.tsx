import { useEffect } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useAudioInputDevices } from '@/features/voice-capture/model/useAudioInputDevices'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Item, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'

export function MicrophoneSettings() {
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const setMicrophoneDeviceId = useSettingsStore((s) => s.setMicrophoneDeviceId)
  const { devices, permissionDenied, loading, refresh } = useAudioInputDevices()

  useEffect(() => {
    if (!microphoneDeviceId) return
    if (devices.some((device) => device.deviceId === microphoneDeviceId)) return
    setMicrophoneDeviceId('')
  }, [devices, microphoneDeviceId, setMicrophoneDeviceId])

  return (
    <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
      <ItemContent className="gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="microphone-device" className="text-xs font-medium">
            Microphone
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            className="h-6 px-2 text-xs"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </div>

        <select
          id="microphone-device"
          className={cn(
            settingsInputClass,
            'w-full rounded-md border border-input bg-background text-foreground'
          )}
          value={microphoneDeviceId}
          disabled={loading || permissionDenied}
          onChange={(e) => setMicrophoneDeviceId(e.target.value)}
        >
          <option value="">System default</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>

        {permissionDenied ? (
          <ItemDescription className="text-xs text-destructive">
            Microphone access denied. Allow the mic in system settings, then refresh.
          </ItemDescription>
        ) : loading ? (
          <ItemDescription className="text-xs">Loading devices…</ItemDescription>
        ) : devices.length === 0 ? (
          <ItemDescription className="text-xs">
            No microphones found. Connect a device and refresh.
          </ItemDescription>
        ) : (
          <ItemDescription className="text-xs">
            Used for voice input in chat. Hold the mic button to speak.
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  )
}
