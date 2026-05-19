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
  return devices.filter((device) => device.kind === 'audioinput')
}

export async function acquireMicrophoneStream(deviceId: string): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null

  const constraints: MediaStreamConstraints = isSystemDefaultMicrophone(deviceId)
    ? { audio: true }
    : { audio: { deviceId: { exact: deviceId } } }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch {
    if (isSystemDefaultMicrophone(deviceId)) return null
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return null
    }
  }
}

export function releaseMicrophoneStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}
