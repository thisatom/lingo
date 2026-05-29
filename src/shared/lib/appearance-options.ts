import type { TextScale, UiFontFamily } from '@/shared/lib/appearance'

export const UI_FONT_FAMILY_OPTIONS: { value: UiFontFamily; label: string; hint: string }[] = [
  {
    value: 'system',
    label: 'System UI',
    hint: 'Default interface font for your platform.'
  },
  {
    value: 'serif',
    label: 'Serif',
    hint: 'Easier long-form reading in chat messages.'
  },
  {
    value: 'monospace',
    label: 'Monospace',
    hint: 'Fixed-width text across the app.'
  }
]

export const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'comfortable', label: 'Comfortable' }
]

export const CONVERSATION_DENSITY_OPTIONS: { value: TextScale; label: string; hint: string }[] =
  [
    { value: 'compact', label: 'Compact', hint: 'Less space between conversation turns.' },
    { value: 'default', label: 'Default', hint: 'Balanced spacing in the chat column.' },
    {
      value: 'comfortable',
      label: 'Comfortable',
      hint: 'More breathing room between turns.'
    }
  ]
