# electron

Main process и preload (вне FSD).

| Путь | Роль |
|------|------|
| `main/` | `BrowserWindow`, `@incanta/custom-electron-titlebar`, IPC |
| `preload/` | `contextBridge` → `window.lingo` |

См. [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
