import { AppearanceSettingsSection } from '@/features/user-settings/ui/AppearanceSettingsSection'
import { settingsSectionTitleClass } from '@/shared/lib/settings-surface'

export function AppearanceSettingsForm() {
  return (
    <section>
      <h2 className={settingsSectionTitleClass}>Appearance</h2>
      <AppearanceSettingsSection />
    </section>
  )
}
