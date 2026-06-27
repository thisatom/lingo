# Lingo

**Lingo** is a desktop app for practicing conversational speech in different languages. Speak or type, get a streaming AI reply, and hear it read aloud.

**Current version:** 0.1.7 · **Windows, macOS, Linux**

> **Web preview** (`npm run dev:web`) is for UI development only — limited parity, no OS keychain, no Whisper/edge-tts in main.

## Download

Installers are published on [GitHub Releases](https://github.com/thisatom/lingo/releases):

| Platform | Artifact |
|----------|----------|
| Windows (64-bit) | `Lingo-*-win-setup.exe` (NSIS installer) |
| Linux (64-bit) | `Lingo-*-linux-x64.AppImage`, `.deb`, or `.tar.gz` |
| macOS (Intel / Apple Silicon) | `Lingo-*-mac-*.dmg` or `.zip` |

In the app: **Settings → About** — check for updates and open the download page.

## Features

| Area | What you get |
|------|----------------|
| **Chat** | Streaming replies, attachments, search across chats, per-chat drafts, auto-saved history |
| **Cloud AI** | [OpenRouter](https://openrouter.ai/) — model catalog, web search toggle, fallback to a free model |
| **Custom LLM** | Any OpenAI-compatible API (Ollama, LM Studio, vLLM, …); JSON profile editor; import from axios/OpenAI SDK snippets |
| **Voice input** | Hold mic — local Whisper (desktop) or Web Speech (web preview); noise suppression in settings |
| **TTS** | Synthesis in the app process (desktop); volume and speed in settings |
| **Onboarding** | First-run setup in the main window (name, theme, language, optional OpenRouter key) |
| **UI** | Dark/light themes, resizable sidebar, custom title bar, [shadcn/ui](https://ui.shadcn.com/) |

## Quick start

1. Install from a [release](https://github.com/thisatom/lingo/releases) or [build from source](#build-from-source).
2. Complete the setup dialog on first launch (OpenRouter key can be skipped and added later).
3. Hold the **microphone** or type in the composer. In conversation mode, replies can be spoken automatically.

## API keys and models

### OpenRouter (default)

1. **Settings → API → Chat source → OpenRouter**
2. Paste your API key — stored in the **OS credential store** (Windows Credential Manager, macOS Keychain, Linux Secret Service).
3. Pick a model from the catalog or enter a model ID.

See [`docs/OPENROUTER.md`](./docs/OPENROUTER.md) and [`docs/API_KEYS.md`](./docs/API_KEYS.md).

### Custom LLM endpoint

1. **Settings → API → Chat source → Custom server**
2. Set base URL, model, and optional parameters in the JSON profile.
3. Use **API key for custom server** when needed (local Ollama often needs none).
4. **Import code snippet** — paste axios or OpenAI SDK example; URL/model go to profile, tokens to secure storage.

Secrets are stripped from saved JSON (`apiKey` / `api_key` removed on write).

## System requirements

| | |
|---|---|
| **Desktop** | Windows 10/11 (64-bit), macOS 12+, Linux x64 (glibc) |
| **Development** | Node.js 20+, npm 10+ |
| **Hardware** | Microphone for voice input; network for cloud models |

## Build from source

```bash
git clone https://github.com/thisatom/lingo.git
cd lingo
npm install
npm run dev
```

### Linux dependencies

```bash
sudo apt update
sudo apt install -y build-essential python3 libsecret-1-dev
```

Use **npm** (not `pnpm`) for the first install. Do **not** pass `--ignore-scripts` — `postinstall` downloads Electron and rebuilds native modules (`keytar`, Whisper).

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find module '../build/Release/keytar.node'` | `npm run rebuild:native` or `npm run postinstall` |
| `Error: Electron uninstall` / missing binary | `npm run electron:install` |
| Slow Electron download | `export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"` then reinstall |

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Electron + hot reload |
| `npm run dev:web` | UI in browser only (no keytar / main STT-TTS) |
| `npm run build` | Production Electron build → `out/` |
| `npm run build:web` | Static web preview build |
| `npm run dist` | Installer for current OS → `release/` |
| `npm run dist:win` / `dist:linux` / `dist:mac` | Platform-specific installers |
| `npm run typecheck` | TypeScript (renderer + main) |
| `npm run test` | Unit & integration tests (Vitest) |
| `npm run test:e2e` | Playwright E2E (web preview) |
| `npm run test:e2e:ui` | Playwright interactive mode |
| `npm run rebuild:native` | Rebuild keytar for Electron ABI |
| `npm run icons:png` | Convert `resources/icon.ico` to PNG |

### Release builds (CI)

Push a tag `v*` (e.g. `v0.1.7`) to run [`.github/workflows/release.yml`](.github/workflows/release.yml): tests, then Windows/Linux/macOS artifacts attached to a GitHub Release.

- **Windows:** `npm run dist:win` → `release/Lingo-<version>-win-setup.exe`
- **Linux on Windows:** use CI release for AppImage/deb; local cross-build is limited
- **macOS:** run `npm run dist:mac` on a Mac, or use the release workflow

### Dev-only API key (optional)

Create `.env` in the project root (never commit):

```env
LINGO_OPENROUTER_API_KEY=sk-or-v1-...
```

Template: [`docs/env.example.md`](./docs/env.example.md). Packaged builds use **Settings → API**.

## Testing

```bash
npm run typecheck
npm run test
npm run test:e2e:install   # once: Chromium for Playwright
npm run test:e2e
```

| Layer | Tool | Scope |
|-------|------|--------|
| Unit / integration | Vitest | Store, agent, IPC helpers, scroll, sanitization |
| E2E | Playwright | Web preview UI — load, sidebar, settings nav, composer |
| CI | GitHub Actions | typecheck, unit, e2e, Electron + web builds on every push/PR |

E2E details: [`docs/E2E.md`](./docs/E2E.md). Electron smoke (keytar, Whisper, titlebar) is **not** in CI yet.

## Project layout

```
lingo/
├── electron/          # Main: windows, IPC, STT/TTS, secrets, stream proxy
├── electron/preload/  # contextBridge → window.lingo
├── src/               # React UI (FSD: app → pages → widgets → features → entities → shared)
├── e2e/               # Playwright specs (web preview)
├── docs/              # Architecture and contracts
├── audit/             # Stabilization QA matrices
├── resources/         # App icons
├── index.html         # Electron renderer shell
└── index.web.html     # Web preview entry
```

UI imports follow [Feature-Sliced Design](https://feature-sliced.design/) — top-down only. See [`docs/FSD.md`](./docs/FSD.md).

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Electron processes, title bar, IPC |
| [docs/STACK.md](./docs/STACK.md) | AI SDK, TTS, OpenRouter |
| [docs/SPEECH_PIPELINE.md](./docs/SPEECH_PIPELINE.md) | Mic → STT → model → voice |
| [docs/UI.md](./docs/UI.md) | Components and styling |
| [docs/OPENROUTER.md](./docs/OPENROUTER.md) | OpenRouter usage |
| [docs/API_KEYS.md](./docs/API_KEYS.md) | Storing and rotating keys |
| [docs/E2E.md](./docs/E2E.md) | Playwright E2E |
| [docs/voice-input-architecture.md](./docs/voice-input-architecture.md) | Voice input |
| [docs/env.example.md](./docs/env.example.md) | Dev environment variables |
| [AGENTS.md](./AGENTS.md) | Context for AI coding assistants |

## Mobile (iPhone / Android)

**Not supported today.** Lingo is an **Electron desktop** app (Windows/macOS/Linux).

| Approach | Effort | Parity |
|----------|--------|--------|
| **Web preview on phone** | Low — open dev server or host `build:web` | No keytar, no Whisper in main, Web Speech only, keys in browser storage — **not for production secrets** |
| **Capacitor / TWA wrapper** around web build | Medium | Same gaps as web preview unless you rebuild STT/TTS/secrets for mobile |
| **React Native / Flutter rewrite** | Very high | Full native mobile product |
| **GitHub Actions “mobile build”** | N/A without mobile stack | Current CI builds **desktop** artifacts only |

Using Lingo on a phone realistically requires a **dedicated mobile architecture** (or accepting web-preview limits in the mobile browser). That is out of scope for the current Electron release pipeline.

## Security

- Do not commit `.env`, API keys, or user data directories.
- **Desktop** — keys in OS credential store; renderer has no direct secret filesystem access.
- **`dev:web`** — keys in `localStorage` (plain text); development only.
- Custom LLM profiles never persist keys in JSON.

## License

See [LICENSE](./LICENSE).
