import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { HtmlSplashGate } from '@/app/HtmlSplashGate'
import { registerActiveChatEffects } from '@/app/register-active-chat-effects'
import { setupTesseractImageOcr } from '@/shared/lib/image-ocr-tesseract'
import { setupLocalWebSearch } from '@/shared/lib/setup-local-web-search'
import { ensureLingoBridge } from '@/shared/lib/lingo-bridge'
import { initThemeFromStorage } from '@/shared/lib/theme'
import 'katex/dist/katex.min.css'
import '@/app/styles/globals.css'
import '@/app/styles/markdown-code.css'
import '@/app/styles/markdown-math.css'

ensureLingoBridge()
setupTesseractImageOcr()
setupLocalWebSearch()
initThemeFromStorage()
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
