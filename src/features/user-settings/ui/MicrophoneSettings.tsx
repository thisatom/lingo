import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useAudioInputDevices } from '@/features/voice-capture/model/useAudioInputDevices'
import {
  settingsInputClass,
  settingsSelectContentClass,
  settingsSelectItemClass
} from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Item, ItemContent, ItemDescription } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'

const DEFAULT_MIC_VALUE = '__default__'

export function MicrophoneSettings() {
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const microphoneLabel = useSettingsStore((s) => s.microphoneLabel)
  const setMicrophoneDevice = useSettingsStore((s) => s.setMicrophoneDevice)
  const { devices, permissionDenied, loading, refresh } = useAudioInputDevices()
  const validatedRef = useRef(false)

  useEffect(() => {
    if (loading) return
    if (permissionDenied) return
    if (devices.length === 0) return

    if (!microphoneDeviceId && !microphoneLabel) {
      validatedRef.current = true
      return
    }

    const byId = devices.find((d) => d.deviceId === microphoneDeviceId)
    if (byId) {
      if (byId.label !== microphoneLabel) {
        setMicrophoneDevice(byId.deviceId, byId.label)
      }
      validatedRef.current = true
      return
    }

    const byLabel = microphoneLabel
      ? devices.find((d) => d.label === microphoneLabel)
      : undefined
    if (byLabel) {
      setMicrophoneDevice(byLabel.deviceId, byLabel.label)
      validatedRef.current = true
      return
    }

    if (!validatedRef.current) {
      validatedRef.current = true
      return
    }

    setMicrophoneDevice('', '')
  }, [
    devices,
    loading,
    microphoneDeviceId,
    microphoneLabel,
    permissionDenied,
    setMicrophoneDevice
  ])

  const selectValue =
    microphoneDeviceId && devices.some((d) => d.deviceId === microphoneDeviceId)
      ? microphoneDeviceId
      : DEFAULT_MIC_VALUE

  return (
    <Item size="sm" className="flex-col items-stretch rounded-[8px] border border-border p-3">
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

        <Select
          value={selectValue}
          onValueChange={(value) => {
            if (value === DEFAULT_MIC_VALUE) {
              setMicrophoneDevice('', '')
              return
            }
            const device = devices.find((d) => d.deviceId === value)
            setMicrophoneDevice(value, device?.label ?? '')
          }}
          disabled={loading || permissionDenied}
        >
          <SelectTrigger
            id="microphone-device"
            size="sm"
            className={cn(settingsInputClass, 'w-full min-w-0 border-input shadow-none')}
          >
            <SelectValue placeholder="System default" />
          </SelectTrigger>
          <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
            <SelectItem value={DEFAULT_MIC_VALUE} className={settingsSelectItemClass}>
              System default
            </SelectItem>
            {devices.map((device) => (
              <SelectItem
                key={device.deviceId}
                value={device.deviceId}
                className={settingsSelectItemClass}
              >
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
            Used to allow mic access. Speech recognition uses the system default input.
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  )
}
