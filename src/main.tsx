import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { HtmlSplashGate } from '@/app/HtmlSplashGate'
import { registerActiveChatEffects } from '@/app/register-active-chat-effects'
import '@/app/styles/globals.css'

registerActiveChatEffects()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <>
      <HtmlSplashGate />
      <App />
    </>
  </StrictMode>
)
