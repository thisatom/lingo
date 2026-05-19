import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { MainPage } from '@/pages/main/ui/MainPage'
import { SettingsPage } from '@/pages/settings/ui/SettingsPage'

export function App() {
  return (
    <div className="app-shell">
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<Navigate to="/settings/user" replace />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </div>
  )
}
