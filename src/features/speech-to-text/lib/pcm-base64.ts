/** Raw mono float32 PCM at 16 kHz — compact IPC payload for local Whisper. */
export const STT_PCM_F32_FORMAT = 'pcm-f32' as const

export function float32ToBase64(samples: Float32Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

export function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const aligned = bytes.byteOffset % 4 === 0 && bytes.byteLength % 4 === 0
  if (aligned) {
    return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
  }
  const out = new Float32Array(bytes.byteLength / 4)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0; i < out.length; i++) {
    out[i] = view.getFloat32(i * 4, true)
  }
  return out
}
