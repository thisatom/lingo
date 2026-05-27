# Lingo

**Lingo** is a desktop app for practicing conversational speech in different languages. Type or speak, get an AI reply, and optionally hear it read aloud.

Version **0.1.0** · Windows, macOS, Linux

## Download

Installers are published on [GitHub Releases](https://github.com/thisatom/lingo/releases):

| Platform | File |
|----------|------|
| Windows (64-bit) | `Lingo-0.1.0-win-setup.exe` — installer with folder picker |
| Linux (64-bit) | `Lingo-0.1.0-linux-x64.tar.gz` — extract and run `./lingo` |
| macOS (Intel / Apple Silicon) | `Lingo-0.1.0-mac-*.dmg` or `.zip` |

In the app: **Settings → About** — check for updates and open the download page.

## What you can do

- **Chat** — text and voice input, streaming replies, attachments, search across chats, auto-saved history
- **Cloud models** — [OpenRouter](https://openrouter.ai/): model catalog, web search, automatic fallback to a free model on failure
- **Your own server** — any OpenAI-compatible API (Ollama, LM Studio, vLLM, etc.); JSON profile editor, import snippets from axios or the OpenAI SDK; API keys stay in secure storage, not in JSON
- **Voice input** — hold the mic button; local Whisper or browser speech recognition; noise suppression in settings
- **Text-to-speech** — synthesis runs in the app process (not in a browser tab); volume and speed in settings
- **First launch** — setup dialog in the main window (name, theme, language, OpenRouter key)
- **UI** — dark and light themes, custom window title bar, [shadcn/ui](https://ui.shadcn.com/) components

## Quick start

1. Install from a [release](https://github.com/thisatom/lingo/releases) or [build from source](#build-from-source) below.
2. On first launch the main window opens; complete the setup dialog if it appears.
3. You can **skip the OpenRouter key** during setup and add it later under **Settings → API**.
4. Hold the **microphone** to speak or type in the composer. In conversation mode, replies can be spoken automatically.

## API keys and models

### OpenRouter (default)

1. Open **Settings → API → Chat source → OpenRouter**.
2. Paste your API key — it is stored in the **system credential store** (Windows Credential Manager, macOS Keychain, Linux Secret Service), not in app data files or browser storage.
3. Pick a model from the catalog or enter a model ID manually.

More detail: [`docs/OPENROUTER.md`](./docs/OPENROUTER.md), [`docs/API_KEYS.md`](./docs/API_KEYS.md).

### Custom LLM endpoint

1. **Settings → API → Chat source → Custom server**.
2. In the profile: base URL, model, and optional parameters (temperature, streaming, reasoning mode, etc.).
3. Use **API key for custom server** when needed; local Ollama often needs no key.
4. **Import code snippet** — paste an axios or OpenAI SDK example: URL and model go into the profile; auth tokens go to secure storage.
5. **Reset template** — example `http://127.0.0.1:11434/v1` with `llama3.2`.

Secrets are stripped from saved JSON (`apiKey` / `api_key` fields are removed on write).

## System requirements

- **Windows** 10/11 (64-bit), **macOS** 12+, **Linux** x64 with glibc (common distros)
- For development: **Node.js** 20+, **npm** 10+
- Microphone for voice input; internet for cloud models and online TTS

## Build from source

```bash
git clone https://github.com/thisatom/lingo.git
cd lingo
npm install
npm run dev
```

### Linux (Debian, Ubuntu, etc.)

Install build tools and **libsecret** (for `keytar` / OS credential storage):

```bash
sudo apt update
sudo apt install -y build-essential python3 libsecret-1-dev
```

Use **npm** (not `pnpm`) for the first install, and do not pass `--ignore-scripts` — Electron downloads its binary in `postinstall`.

If `npm run dev` fails with **`Error: Electron uninstall`**, the Electron binary was not installed:

```bash
npm run electron:install
# or manually:
node node_modules/electron/install.js
npm run dev
```

Behind a slow or filtered network, set a mirror before reinstalling:

```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
rm -rf node_modules/electron
npm install
```

UI-only in the browser (no Electron): `npm run dev:web` — keys are not stored in the OS keychain.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development (Electron + hot reload) |
| `npm run dev:web` | UI only in the browser (no TTS, no OS keychain — **not for real secrets**) |
| `npm run build` | Production build |
| `npm run dist` | Installer for the current OS → `release/` |
| `npm run dist:win` | Windows NSIS installer |
| `npm run dist:linux` | Linux tar.gz and unpacked folder |
| `npm run dist:mac` | macOS DMG and ZIP (**macOS only**) |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests (Vitest) |
| `npm run icons:png` | Convert `resources/icon.ico` to PNG |

**Build notes**

- Windows: `npm run dist:win` → `release/Lingo-<version>-win-setup.exe`
- Linux on Windows: produces tar.gz; AppImage/deb are easier via [CI Release](.github/workflows/release.yml) on Ubuntu
- macOS: run `npm run dist:mac` on a Mac, or push tag `v*` for GitHub Actions

### Dev-only API key (optional)

Create `.env` in the project root (do not commit):

```env
LINGO_OPENROUTER_API_KEY=sk-or-v1-...
```

Template: [`docs/env.example.md`](./docs/env.example.md). In packaged builds, use **Settings → API** instead.

## Project layout

```
lingo/
├── electron/          # Main process: windows, IPC, TTS, secrets
├── src/               # React UI (app → pages → widgets → features → entities → shared)
├── docs/              # Architecture and contracts
├── resources/         # Build icons
└── index.html         # Main window entry
```

Imports in `src/` follow [Feature-Sliced Design](https://feature-sliced.design/) — only top-down. See [`docs/FSD.md`](./docs/FSD.md).

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Electron processes, title bar, IPC |
| [docs/STACK.md](./docs/STACK.md) | AI SDK, TTS, OpenRouter |
| [docs/SPEECH_PIPELINE.md](./docs/SPEECH_PIPELINE.md) | Mic → STT → model → voice |
| [docs/UI.md](./docs/UI.md) | Components and styling |
| [docs/OPENROUTER.md](./docs/OPENROUTER.md) | OpenRouter usage |
| [docs/API_KEYS.md](./docs/API_KEYS.md) | Storing and rotating keys |
| [docs/voice-input-architecture.md](./docs/voice-input-architecture.md) | Voice input |
| [docs/env.example.md](./docs/env.example.md) | Dev environment variables |
| [AGENTS.md](./AGENTS.md) | Context for AI coding assistants |

## Security

- Do not commit `.env`, API keys, or secret files from user data directories.
- **Desktop app** — keys in the OS credential store; the renderer has no direct filesystem or full-secret access.
- **`dev:web`** — for UI development only: keys live in browser `localStorage` in plain text; do not use production secrets.
- Custom LLM profiles never store keys in JSON; imported tokens go to secure storage.

## License

See [LICENSE](./LICENSE).
