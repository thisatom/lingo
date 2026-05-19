/** Microphone noise suppression strength for pre-Whisper audio processing. */
export type MicNoiseSuppression = 'off' | 'light' | 'medium' | 'strong'

export const MIC_NOISE_SUPPRESSION_OPTIONS: {
  value: MicNoiseSuppression
  label: string
  description: string
}[] = [
  {
    value: 'off',
    label: 'Off',
    description: 'No filtering — full recording sent to speech recognition.'
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Recommended. Removes low rumble and normalizes volume without cutting words.'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Soft noise gate for steady background hum.'
  },
  {
    value: 'strong',
    label: 'Strong',
    description: 'Aggressive gate and edge trim — may clip quiet syllables.'
  }
]

export function isMicNoiseSuppression(value: unknown): value is MicNoiseSuppression {
  return value === 'off' || value === 'light' || value === 'medium' || value === 'strong'
}
