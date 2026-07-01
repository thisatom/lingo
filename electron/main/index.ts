import { app, BrowserWindow, session } from 'electron'
import { recoverIncompleteUpdateOnStartup } from './app-update'
import { registerDevToolsShortcut, unregisterDevToolsShortcut } from './devtools'
import { applyDockIcon } from './icon'
import { registerIpcHandlers } from './ipc'
import { warmOpenRouterConnection } from './openrouter-fetch'
import { shutdownSttWorker, warmSttWorker } from './stt'
import { loadEnvBootstrap, warmSecretsCache } from './secrets'
import { setupRendererContentSecurityPolicy } from './content-security-policy'
import { setupSingleInstanceApp, setupTitlebarOnce } from './window-manager'
import { focusMainWindow, launchDesktopWindows } from './welcome-flow'

// Allow TTS playback after async API calls (no fresh user gesture).
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

if (!setupSingleInstanceApp(focusMainWindow)) {
  // Secondary process exits immediately — avoids userData / disk cache conflicts.
} else {
  app.whenReady().then(async () => {
    applyDockIcon()
    setupRendererContentSecurityPolicy(app.isPackaged)

    const allowMedia = (permission: string) =>
      permission === 'media' || permission === 'microphone' || permission === 'audioCapture'

    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(allowMedia(permission))
    })

    session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
      allowMedia(permission)
    )

    setupTitlebarOnce()
    registerDevToolsShortcut()
    registerIpcHandlers()
    recoverIncompleteUpdateOnStartup()

    void launchDesktopWindows()

    void (async () => {
      try {
        await loadEnvBootstrap()
        await warmSecretsCache()
        void warmOpenRouterConnection()
        warmSttWorker()
      } catch (error) {
        console.error('[lingo] Failed to load API key bootstrap:', error)
      }
    })()
  }).catch((error) => {
    console.error('[lingo] Startup failed:', error)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void launchDesktopWindows()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', () => {
    unregisterDevToolsShortcut()
    void shutdownSttWorker()
  })
}
