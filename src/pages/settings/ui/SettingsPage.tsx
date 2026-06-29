import { Navigate, useParams } from 'react-router-dom'
import { resolveSettingsSectionId } from '@/entities/settings/config/sections'
import { AgentSettingsForm } from '@/features/ai-chat/ui/AgentSettingsForm'
import { ApiSettingsForm } from '@/features/manage-api-keys/ui/ApiSettingsForm'
import { TtsSettingsForm } from '@/features/text-to-speech/ui/TtsSettingsForm'
import { DevicesSettingsForm } from '@/features/user-settings/ui/DevicesSettingsForm'
import { AppearanceSettingsForm } from '@/features/user-settings/ui/AppearanceSettingsForm'
import { UserSettingsForm } from '@/features/user-settings/ui/UserSettingsForm'
import { settingsPageContentClass } from '@/shared/lib/settings-surface'
import { PAGE_HORIZONTAL_PADDING_CLASS } from '@/shared/lib/layout'
import { cn } from '@/shared/lib/utils'
import { CustomScrollArea } from '@/shared/ui/custom-scroll-area'

export function SettingsPage() {
  const { section } = useParams<{ section?: string }>()
  const resolvedSection = resolveSettingsSectionId(section)

  if (!section) {
    return <Navigate to="/settings/general" replace />
  }

  if (!resolvedSection) {
    return <Navigate to="/settings/general" replace />
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <CustomScrollArea variant="settings" className="min-h-0 flex-1">
        <div className={cn('py-3 sm:py-4', PAGE_HORIZONTAL_PADDING_CLASS)}>
          <div className={cn(settingsPageContentClass, 'min-w-0')}>
            {resolvedSection === 'general' && <UserSettingsForm />}
            {resolvedSection === 'appearance' && <AppearanceSettingsForm />}
            {resolvedSection === 'devices' && <DevicesSettingsForm />}
            {resolvedSection === 'speech' && <TtsSettingsForm />}
            {resolvedSection === 'agent' && <AgentSettingsForm />}
            {resolvedSection === 'api' && <ApiSettingsForm />}
          </div>
        </div>
      </CustomScrollArea>
    </div>
  )
}
