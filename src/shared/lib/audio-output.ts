const SYSTEM_DEFAULT_DEVICE_ID = ''

export function isSystemDefaultSpeaker(deviceId: string): boolean {
  return !deviceId || deviceId === SYSTEM_DEFAULT_DEVICE_ID
}

export function formatSpeakerLabel(device: MediaDeviceInfo, index: number): string {
  const name = device.label?.trim()
  if (name) return name
  return `Speaker ${index + 1}`
}

export async function listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audiooutput' && device.deviceId)
}

export function isAudioOutputSelectionSupported(): boolean {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype
}

export async function applyAudioOutputDevice(
  mediaElement: HTMLMediaElement,
  deviceId: string
): Promise<void> {
  if (isSystemDefaultSpeaker(deviceId)) return
  if (!('setSinkId' in mediaElement)) return

  const setSinkId = (
    mediaElement as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> }
  ).setSinkId.bind(mediaElement)

  try {
    await setSinkId(deviceId)
  } catch {
    // OS may reject invalid or unavailable sink — fall back to default output
  }
}
