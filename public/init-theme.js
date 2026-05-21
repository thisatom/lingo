;(function () {
  try {
    var raw = localStorage.getItem('lingo-settings')
    var pref = 'dark'
    if (raw) {
      var parsed = JSON.parse(raw)
      var state = parsed.state || parsed
      if (state.appTheme === 'light' || state.appTheme === 'dark' || state.appTheme === 'system') {
        pref = state.appTheme
      }
    }
    var dark =
      pref === 'dark' ||
      (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    var bg = dark ? '#121212' : '#f5f5f5'
    var fg = dark ? '#d1d1d1' : '#1e1e1e'
    var root = document.documentElement
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', bg)
    var scheme = document.querySelector('meta[name="color-scheme"]')
    if (scheme) scheme.setAttribute('content', dark ? 'dark' : 'light')
    root.style.backgroundColor = bg
    root.style.color = fg
    if (document.body) {
      document.body.style.backgroundColor = bg
      document.body.style.color = fg
    }
    var splash = document.getElementById('app-splash')
    if (splash) splash.style.background = bg
  } catch (e) {
    document.documentElement.classList.add('dark')
  }
})()
