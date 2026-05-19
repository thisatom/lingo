const SYSTEM_DEFAULT_DEVICE_ID = ''

export function isSystemDefaultMicrophone(deviceId: string): boolean {
  return !deviceId || deviceId === SYSTEM_DEFAULT_DEVICE_ID
}

export function formatMicrophoneLabel(device: MediaDeviceInfo, index: number): string {
  const name = device.label?.trim()
  if (name) return name
  return `Microphone ${index + 1}`
}

export async function ensureMicrophonePermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}

export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audioinput' && device.deviceId)
}

async function openAudioStream(deviceId: string): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } }
    })
  } catch {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { ideal: deviceId } }
      })
    } catch {
      return null
    }
  }
}

/** Open mic stream using saved device id, with label fallback when ids change between sessions. */
export async function acquireMicrophoneStream(
  deviceId: string,
  preferredLabel?: string
): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null

  if (!isSystemDefaultMicrophone(deviceId)) {
    const byId = await openAudioStream(deviceId)
    if (byId) return byId

    if (preferredLabel?.trim()) {
      const devices = await listAudioInputDevices()
      const match = devices.find((d) => d.label === preferredLabel)
      if (match?.deviceId) {
        const byLabel = await openAudioStream(match.deviceId)
        if (byLabel) return byLabel
      }
    }
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    return null
  }
}

export function releaseMicrophoneStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}
