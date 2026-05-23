export async function copyToClipboard(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) return false

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // Electron / non-secure contexts may block async clipboard API.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
