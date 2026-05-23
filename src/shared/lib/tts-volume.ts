export const TTS_VOLUME_DEFAULT = 100
export const TTS_VOLUME_MIN = 0
export const TTS_VOLUME_MAX = 100

export function normalizeTtsVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return TTS_VOLUME_DEFAULT
  }
  return Math.min(TTS_VOLUME_MAX, Math.max(TTS_VOLUME_MIN, Math.round(value)))
}

/** HTMLMediaElement.volume gain (0–1) from user percent (0–100). */
export function ttsVolumeToGain(volumePercent: number): number {
  return normalizeTtsVolume(volumePercent) / 100
}
