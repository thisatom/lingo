import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/shared/ui/sonner'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AppShutdownSaver } from '@/app/ui/AppShutdownSaver'
import { AppUpdateGate } from '@/app/ui/AppUpdateGate'
import { OnboardingGate } from '@/app/ui/OnboardingGate'
import { MainPage } from '@/pages/main/ui/MainPage'
import { SettingsPage } from '@/pages/settings/ui/SettingsPage'

export function App() {
  return (
    <div className="app-shell">
      <AppShutdownSaver />
      <OnboardingGate />
      <AppUpdateGate />
      <Toaster position="bottom-right" closeButton />
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </div>
  )
}
