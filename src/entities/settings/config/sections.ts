export type SettingsSectionId = 'user' | 'devices' | 'speech' | 'practice' | 'api'

export interface SettingsSection {
  id: SettingsSectionId
  label: string
  path: string
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'user',
    label: 'User',
    path: '/settings/user'
  },
  {
    id: 'devices',
    label: 'Devices',
    path: '/settings/devices'
  },
  {
    id: 'speech',
    label: 'Speech',
    path: '/settings/speech'
  },
  {
    id: 'practice',
    label: 'Practice',
    path: '/settings/practice'
  },
  {
    id: 'api',
    label: 'API',
    path: '/settings/api'
  }
]

export function getSettingsSection(id: string | undefined): SettingsSection {
  return SETTINGS_SECTIONS.find((s) => s.id === id) ?? SETTINGS_SECTIONS[0]
}

export function isSettingsSectionId(id: string | undefined): id is SettingsSectionId {
  return SETTINGS_SECTIONS.some((s) => s.id === id)
}
