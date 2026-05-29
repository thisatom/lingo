export type SettingsSectionId = 'general' | 'appearance' | 'devices' | 'speech' | 'agent' | 'api'

export interface SettingsSection {
  id: SettingsSectionId
  label: string
  path: string
}

/** Sidebar groups — visual spacing is applied between groups. */
export const SETTINGS_NAV_GROUPS: readonly SettingsSectionId[][] = [
  ['general', 'appearance'],
  ['devices', 'speech'],
  ['agent', 'api']
]

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    path: '/settings/general'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    path: '/settings/appearance'
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
    id: 'agent',
    label: 'Agent',
    path: '/settings/agent'
  },
  {
    id: 'api',
    label: 'API',
    path: '/settings/api'
  }
]

const SECTION_BY_ID = new Map(SETTINGS_SECTIONS.map((section) => [section.id, section]))

export function getSettingsSection(id: string | undefined): SettingsSection {
  return SECTION_BY_ID.get(id as SettingsSectionId) ?? SETTINGS_SECTIONS[0]
}

export function isSettingsSectionId(id: string | undefined): id is SettingsSectionId {
  return SETTINGS_SECTIONS.some((s) => s.id === id)
}

/** Legacy route ids from older settings URLs. */
export function resolveSettingsSectionId(id: string | undefined): SettingsSectionId | null {
  if (!id) return null
  if (isSettingsSectionId(id)) return id
  if (id === 'user') return 'general'
  if (id === 'practice') return 'agent'
  return null
}
