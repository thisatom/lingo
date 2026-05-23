import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WelcomePage } from '@/pages/welcome/ui/WelcomePage'
import { initThemeFromStorage } from '@/shared/lib/theme'
import '@/app/styles/globals.css'

initThemeFromStorage()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <WelcomePage />
  </StrictMode>
)
