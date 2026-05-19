import { Navigate, useParams } from 'react-router-dom'
import { isSettingsSectionId } from '@/entities/settings/config/sections'
import { OpenRouterKeyForm } from '@/features/manage-api-keys/ui/OpenRouterKeyForm'
import { PracticeSettingsForm } from '@/features/practice-settings/ui/PracticeSettingsForm'
import { UserSettingsForm } from '@/features/user-settings/ui/UserSettingsForm'
import { SidebarExpandButton } from '@/widgets/app-sidebar/ui/SidebarExpandButton'
import { useResizableSidebar } from '@/app/context/resizable-sidebar-context'

export function SettingsPage() {
  const { section } = useParams<{ section?: string }>()
  const { sidebarCollapsed } = useResizableSidebar()

  if (!section) {
    return <Navigate to="/settings/user" replace />
  }

  if (!isSettingsSectionId(section)) {
    return <Navigate to="/settings/user" replace />
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {sidebarCollapsed && (
        <div className="shrink-0 px-4 py-2">
          <SidebarExpandButton />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-2xl pb-4">
          {section === 'user' && <UserSettingsForm />}
          {section === 'practice' && <PracticeSettingsForm />}
          {section === 'api' && <OpenRouterKeyForm />}
        </div>
      </div>
    </div>
  )
}
