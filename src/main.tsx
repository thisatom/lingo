import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { HtmlSplashGate } from '@/app/HtmlSplashGate'
import { registerActiveChatEffects } from '@/app/register-active-chat-effects'
import { setupLocalWebSearch } from '@/shared/lib/setup-local-web-search'
import { ensureLingoBridge } from '@/shared/lib/lingo-bridge'
import { installFileDropNavigationGuard } from '@/shared/lib/prevent-file-drop-navigation'
import { initThemeFromStorage } from '@/shared/lib/theme'
import 'katex/dist/katex.min.css'
import '@vscode/codicons/dist/codicon.css'
import '@/app/styles/globals.css'
import '@/app/styles/markdown-code.css'
import '@/app/styles/markdown-math.css'
import '@/app/styles/thinking-markdown.css'

ensureLingoBridge()
installFileDropNavigationGuard()
setupLocalWebSearch()
void import('@/shared/lib/image-ocr-tesseract').then(({ setupTesseractImageOcr }) => {
  setupTesseractImageOcr()
})
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
