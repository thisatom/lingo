import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/shared/ui/sonner'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AppShutdownSaver } from '@/app/ui/AppShutdownSaver'
import { AppUpdateGate } from '@/app/ui/AppUpdateGate'
import { isWebPlatform } from '@/shared/lib/lingo-bridge'
import { MainPage } from '@/pages/main/ui/MainPage'
import { SettingsPage } from '@/pages/settings/ui/SettingsPage'

const Router = isWebPlatform() ? BrowserRouter : HashRouter

export function App() {
  return (
    <div className="app-shell">
      <AppShutdownSaver />
      <AppUpdateGate />
      <Toaster position="bottom-right" />
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/c/:chatId" element={<MainPage />} />
            <Route path="/settings/:section?" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<MainPage />} />
        </Routes>
      </Router>
    </div>
  )
}
