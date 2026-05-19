import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useAudioLevelMonitor } from '@/features/audio-devices/model/useAudioLevelMonitor'
import { useAudioOutputDevices } from '@/features/audio-devices/model/useAudioOutputDevices'
import { MicLevelVisualizer } from '@/features/audio-devices/ui/MicLevelVisualizer'
import { MIC_NOISE_SUPPRESSION_OPTIONS } from '@/features/speech-to-text/lib/mic-noise-suppression'
import { useAudioInputDevices } from '@/features/voice-capture/model/useAudioInputDevices'
import { settingsInputClass } from '@/shared/lib/settings-control'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Item, ItemContent, ItemDescription, ItemGroup } from '@/shared/ui/item'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'

const DEFAULT_DEVICE_VALUE = '__default__'

export function DevicesSettingsForm() {
  const microphoneDeviceId = useSettingsStore((s) => s.microphoneDeviceId)
  const microphoneLabel = useSettingsStore((s) => s.microphoneLabel)
  const setMicrophoneDevice = useSettingsStore((s) => s.setMicrophoneDevice)
  const micNoiseSuppression = useSettingsStore((s) => s.micNoiseSuppression)
  const setMicNoiseSuppression = useSettingsStore((s) => s.setMicNoiseSuppression)
  const speakerDeviceId = useSettingsStore((s) => s.speakerDeviceId)
  const speakerLabel = useSettingsStore((s) => s.speakerLabel)
  const setSpeakerDevice = useSettingsStore((s) => s.setSpeakerDevice)

  const {
    devices: micDevices,
    permissionDenied: micPermissionDenied,
    loading: micLoading,
    refresh: refreshMics
  } = useAudioInputDevices()
  const {
    devices: speakerDevices,
    loading: speakerLoading,
    refresh: refreshSpeakers,
    sinkSupported
  } = useAudioOutputDevices()

  const [micTestActive, setMicTestActive] = useState(false)
  const micValidatedRef = useRef(false)

  const {
    levels,
    isReceiving,
    permissionDenied: testDenied,
    durationLabel
  } = useAudioLevelMonitor({
    active: micTestActive,
    deviceId: microphoneDeviceId,
    deviceLabel: microphoneLabel
  })

  useEffect(() => {
    if (micLoading) return
    if (micPermissionDenied) return
    if (micDevices.length === 0) return

    if (!microphoneDeviceId && !microphoneLabel) {
      micValidatedRef.current = true
      return
    }

    const byId = micDevices.find((d) => d.deviceId === microphoneDeviceId)
    if (byId) {
      if (byId.label !== microphoneLabel) {
        setMicrophoneDevice(byId.deviceId, byId.label)
      }
      micValidatedRef.current = true
      return
    }

    const byLabel = microphoneLabel
      ? micDevices.find((d) => d.label === microphoneLabel)
      : undefined
    if (byLabel) {
      setMicrophoneDevice(byLabel.deviceId, byLabel.label)
      micValidatedRef.current = true
      return
    }

    if (!micValidatedRef.current) {
      micValidatedRef.current = true
      return
    }

    setMicrophoneDevice('', '')
  }, [
    micDevices,
    micLoading,
    microphoneDeviceId,
    microphoneLabel,
    micPermissionDenied,
    setMicrophoneDevice
  ])

  const micSelectValue =
    microphoneDeviceId && micDevices.some((d) => d.deviceId === microphoneDeviceId)
      ? microphoneDeviceId
      : DEFAULT_DEVICE_VALUE

  const speakerSelectValue =
    speakerDeviceId && speakerDevices.some((d) => d.deviceId === speakerDeviceId)
      ? speakerDeviceId
      : DEFAULT_DEVICE_VALUE

  return (
    <ItemGroup className="gap-4">
      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="devices-microphone" className="text-xs font-medium">
              Microphone
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              className="h-6 px-2 text-xs"
              disabled={micLoading}
              onClick={() => void refreshMics()}
            >
              Refresh
            </Button>
          </div>

          <Select
            value={micSelectValue}
            onValueChange={(value) => {
              if (value === DEFAULT_DEVICE_VALUE) {
                setMicrophoneDevice('', '')
                return
              }
              const device = micDevices.find((d) => d.deviceId === value)
              setMicrophoneDevice(value, device?.label ?? '')
            }}
            disabled={micLoading || micPermissionDenied}
          >
            <SelectTrigger
              id="devices-microphone"
              size="sm"
              className={cn(settingsInputClass, 'w-full min-w-0 border-input shadow-none')}
            >
              <SelectValue placeholder="System default" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={DEFAULT_DEVICE_VALUE}>System default</SelectItem>
              {micDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-2 space-y-1.5">
            <Label htmlFor="devices-noise-suppression" className="text-xs font-medium">
              Noise suppression
            </Label>
            <Select
              value={micNoiseSuppression}
              onValueChange={(value) => {
                const option = MIC_NOISE_SUPPRESSION_OPTIONS.find((o) => o.value === value)
                if (option) setMicNoiseSuppression(option.value)
              }}
            >
              <SelectTrigger
                id="devices-noise-suppression"
                size="sm"
                className={cn(settingsInputClass, 'w-full min-w-0 border-input shadow-none')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {MIC_NOISE_SUPPRESSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ItemDescription className="text-xs">
              {
                MIC_NOISE_SUPPRESSION_OPTIONS.find((o) => o.value === micNoiseSuppression)
                  ?.description
              }
            </ItemDescription>
          </div>

          {micPermissionDenied ? (
            <ItemDescription className="text-xs text-destructive">
              Microphone access denied. Allow the mic in Windows / system settings, then refresh.
            </ItemDescription>
          ) : (
            <ItemDescription className="text-xs">
              Input device for voice capture and speech recognition.
            </ItemDescription>
          )}
        </ItemContent>
      </Item>

      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="devices-speaker" className="text-xs font-medium">
              Headphones / speaker
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="compact"
              className="h-6 px-2 text-xs"
              disabled={speakerLoading}
              onClick={() => void refreshSpeakers()}
            >
              Refresh
            </Button>
          </div>

          <Select
            value={speakerSelectValue}
            onValueChange={(value) => {
              if (value === DEFAULT_DEVICE_VALUE) {
                setSpeakerDevice('', '')
                return
              }
              const device = speakerDevices.find((d) => d.deviceId === value)
              setSpeakerDevice(value, device?.label ?? '')
            }}
            disabled={speakerLoading || !sinkSupported}
          >
            <SelectTrigger
              id="devices-speaker"
              size="sm"
              className={cn(settingsInputClass, 'w-full min-w-0 border-input shadow-none')}
            >
              <SelectValue placeholder="System default" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={DEFAULT_DEVICE_VALUE}>System default</SelectItem>
              {speakerDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ItemDescription className="text-xs">
            {sinkSupported
              ? 'Output for AI voice replies in Conversation mode.'
              : 'Output device selection is not supported in this environment — system default is used.'}
          </ItemDescription>
        </ItemContent>
      </Item>

      <Item size="sm" className="flex-col items-stretch rounded-lg border border-border p-3">
        <ItemContent className="gap-3">
          <div>
            <Label className="text-xs font-medium">Microphone test</Label>
            <ItemDescription className="mt-1 text-xs">
              Start the test and speak — bars should move. &quot;Signal OK&quot; means audio is
              reaching the app.
            </ItemDescription>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-2">
            <MicLevelVisualizer levels={levels} isReceiving={isReceiving} />
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {micTestActive ? durationLabel : '0:00'}
            </span>
            <span
              className={cn(
                'min-w-[4.5rem] shrink-0 text-[10px]',
                testDenied || micPermissionDenied
                  ? 'text-destructive'
                  : isReceiving
                    ? 'text-emerald-500/90'
                    : 'text-muted-foreground'
              )}
            >
              {!micTestActive
                ? 'Idle'
                : testDenied || micPermissionDenied
                  ? 'No access'
                  : isReceiving
                    ? 'Signal OK'
                    : 'No signal'}
            </span>
          </div>

          <div className="flex gap-2">
            {!micTestActive ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={micPermissionDenied}
                onClick={() => setMicTestActive(true)}
              >
                Start test
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMicTestActive(false)}
              >
                Stop test
              </Button>
            )}
          </div>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
