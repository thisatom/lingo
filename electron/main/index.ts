import { app, BrowserWindow, session } from 'electron'
import { registerDevToolsShortcut, unregisterDevToolsShortcut } from './devtools'
import { registerIpcHandlers } from './ipc'
import { warmOpenRouterConnection } from './openrouter-fetch'
import { registerRendererScheme, setupRendererProtocol } from './renderer-protocol'
import { loadEnvBootstrap, warmSecretsCache } from './secrets'
import { setupSingleInstanceApp, setupTitlebarOnce } from './window-manager'
import { focusMainWindow, launchDesktopWindows } from './welcome-flow'

registerRendererScheme()

// Allow TTS playback after async API calls (no fresh user gesture).
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

if (!setupSingleInstanceApp(focusMainWindow)) {
  // Secondary process exits immediately — avoids userData / disk cache conflicts.
} else {
  app.whenReady().then(async () => {
    if (process.platform === 'darwin') {
      const { resolveAppIconPath } = await import('./icon')
      const iconPath = resolveAppIconPath()
      if (iconPath) app.dock?.setIcon(iconPath)
    }

    const allowMedia = (permission: string) =>
      permission === 'media' || permission === 'microphone' || permission === 'audioCapture'

    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(allowMedia(permission))
    })

    session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
      allowMedia(permission)
    )

    await setupRendererProtocol()

    setupTitlebarOnce()
    registerDevToolsShortcut()
    registerIpcHandlers()

    try {
      await loadEnvBootstrap()
      await warmSecretsCache()
      void warmOpenRouterConnection()
    } catch (error) {
      console.error('[lingo] Failed to load API key bootstrap:', error)
    }

    void launchDesktopWindows()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void launchDesktopWindows()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', () => {
    unregisterDevToolsShortcut()
  })
}
