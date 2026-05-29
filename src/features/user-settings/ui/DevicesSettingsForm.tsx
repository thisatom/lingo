import { Play, Square } from 'lucide-react'
import { RefreshCw } from '@/shared/ui/icons'
import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/entities/settings/model/store'
import { useAudioLevelMonitor } from '@/features/audio-devices/model/useAudioLevelMonitor'
import { useAudioOutputDevices } from '@/features/audio-devices/model/useAudioOutputDevices'
import { MicLevelVisualizer } from '@/features/audio-devices/ui/MicLevelVisualizer'
import { MIC_NOISE_SUPPRESSION_OPTIONS } from '@/features/speech-to-text/lib/mic-noise-suppression'
import { useAudioInputDevices } from '@/features/voice-capture/model/useAudioInputDevices'
import {
  settingsInputClass,
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
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ItemDescription } from '@/shared/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select'
import { TooltipIconButton } from '@/shared/ui/tooltip-wrap'

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
    <section>
      <h2 className={settingsSectionTitleClass}>Devices</h2>
      <p className={settingsSubsectionTitleClass}>Input</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Microphone</p>
            <p className={settingsRowDescriptionClass}>
              {micPermissionDenied
                ? 'Microphone access denied. Allow access and refresh.'
                : 'Input device for voice capture and speech recognition.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipIconButton
              type="button"
              variant="ghost"
              size="iconSm"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={micLoading}
              tooltip="Refresh"
              onClick={() => void refreshMics()}
            >
              <RefreshCw className="size-3.5" />
            </TooltipIconButton>
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
              <SelectTrigger id="devices-microphone" size="sm" className={`${settingsSelectTriggerClass} w-[280px] min-w-0`}>
                <SelectValue placeholder="System default" />
              </SelectTrigger>
              <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
                <SelectItem value={DEFAULT_DEVICE_VALUE} className={settingsSelectItemClass}>
                  System default
                </SelectItem>
                {micDevices.map((device) => (
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
          </div>
        </div>

        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Noise suppression</p>
            <p className={settingsRowDescriptionClass}>
              {MIC_NOISE_SUPPRESSION_OPTIONS.find((o) => o.value === micNoiseSuppression)
                ?.description ?? 'Control input cleanup before speech-to-text.'}
            </p>
          </div>
          <Select
            value={micNoiseSuppression}
            onValueChange={(value) => {
              const option = MIC_NOISE_SUPPRESSION_OPTIONS.find((o) => o.value === value)
              if (option) setMicNoiseSuppression(option.value)
            }}
          >
            <SelectTrigger id="devices-noise-suppression" size="sm" className={`${settingsSelectTriggerClass} w-[280px] min-w-0`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
              {MIC_NOISE_SUPPRESSION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className={settingsSelectItemClass}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <p className={settingsSubsectionTitleClass}>Output</p>
      <div className={settingsCardClass}>
        <div className={settingsRowClass}>
          <div className={settingsRowTextWrapClass}>
            <p className={settingsRowTitleClass}>Headphones / speaker</p>
            <p className={settingsRowDescriptionClass}>
              {sinkSupported
                ? 'Output for assistant voice — rate and voice are under Settings → Speech.'
                : 'Output selection is unavailable here — system default is used.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipIconButton
              type="button"
              variant="ghost"
              size="iconSm"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={speakerLoading}
              tooltip="Refresh"
              onClick={() => void refreshSpeakers()}
            >
              <RefreshCw className="size-3.5" />
            </TooltipIconButton>
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
              <SelectTrigger id="devices-speaker" size="sm" className={`${settingsSelectTriggerClass} w-[280px] min-w-0`}>
                <SelectValue placeholder="System default" />
              </SelectTrigger>
              <SelectContent position="popper" className={cn(settingsSelectContentClass)}>
                <SelectItem value={DEFAULT_DEVICE_VALUE} className={settingsSelectItemClass}>
                  System default
                </SelectItem>
                {speakerDevices.map((device) => (
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
          </div>
        </div>
      </div>

      <p className={settingsSubsectionTitleClass}>Diagnostics</p>
      <div className={settingsCardClass}>
        <div className="px-4 py-3">
          <p className={settingsRowTitleClass}>Microphone test</p>
          <p className={settingsRowDescriptionClass}>
            Start the test and speak — bars should move. &quot;Signal OK&quot; means audio is reaching
            the app.
          </p>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-2">
            <MicLevelVisualizer levels={levels} isReceiving={isReceiving} className="shrink" />
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

          <div className="mt-2 flex gap-2">
            {!micTestActive ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className={cn(settingsSelectTriggerClass, 'h-6 gap-1.5 px-2 text-[11px]')}
                disabled={micPermissionDenied}
                onClick={() => setMicTestActive(true)}
              >
                <Play className="size-3 shrink-0" strokeWidth={2} />
                Start test
              </Button>
            ) : (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className={cn(settingsSelectTriggerClass, 'h-6 gap-1.5 px-2 text-[11px]')}
                onClick={() => setMicTestActive(false)}
              >
                <Square className="size-3 shrink-0" strokeWidth={2} />
                Stop test
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
