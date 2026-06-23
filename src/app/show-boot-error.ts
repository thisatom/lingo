/** Surface fatal renderer errors instead of a blank #121212 window. */
export function showBootError(message: string): void {
  const splash = document.getElementById('app-splash')
  splash?.classList.add('app-splash--hide')
  window.setTimeout(() => splash?.remove(), 240)

  const root = document.getElementById('root')
  if (!root) return

  root.innerHTML = ''
  const panel = document.createElement('div')
  panel.style.cssText =
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;padding:24px;text-align:center;font:13px/1.5 system-ui,sans-serif;color:#d1d1d1;user-select:text;-webkit-user-select:text'
  panel.innerHTML = `
    <h1 style="margin:0;font-size:18px;font-weight:600">Lingo failed to start</h1>
    <p style="margin:0;max-width:36rem;color:#9a9a9a;user-select:text;-webkit-user-select:text">${escapeHtml(message || 'Unknown error')}</p>
    <button type="button" style="margin-top:4px;border:1px solid #303030;background:#252525;color:inherit;border-radius:6px;padding:6px 12px;cursor:pointer">Reload</button>
  `
  panel.querySelector('button')?.addEventListener('click', () => window.location.reload())
  root.appendChild(panel)
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function installBootErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    const msg = event.error instanceof Error ? event.error.message : event.message
    if (msg) showBootError(msg)
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection'
    showBootError(msg)
  })
}
