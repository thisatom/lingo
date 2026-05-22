import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function stubWebsearchMcpForWeb(): Plugin {
  const stub = resolve(__dirname, 'src/shared/lib/websearch-mcp-client.stub.ts')
  return {
    name: 'stub-websearch-mcp-web',
    enforce: 'pre',
    resolveId(source) {
      if (
        source === '@/shared/lib/websearch-mcp-client' ||
        source.endsWith('/websearch-mcp-client.ts') ||
        source.endsWith('/websearch-mcp-client')
      ) {
        return stub
      }
      return null
    }
  }
}

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string
}

/** Standalone browser build — macOS, Linux, Windows (any modern browser). */
export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.web.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [stubWebsearchMcpForWeb(), react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_LINGO_PLATFORM': JSON.stringify('web'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
  },
  server: {
    port: 5173,
    strictPort: false
  }
})
