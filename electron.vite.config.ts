import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { injectContentSecurityPolicy } from './vite/inject-csp'

/** Keep Node-only MCP client out of the Electron renderer bundle. */
function stubWebsearchMcpForRenderer(): Plugin {
  const stub = resolve(__dirname, 'src/shared/lib/websearch-mcp-client.stub.ts')
  return {
    name: 'stub-websearch-mcp-renderer',
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

function copyAppResources(): Plugin {
  const resourcesDir = resolve(__dirname, 'resources')
  return {
    name: 'copy-app-resources',
    closeBundle() {
      if (!existsSync(resourcesDir)) return
      cpSync(resourcesDir, resolve(__dirname, 'out/resources'), { recursive: true })
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyAppResources()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/main/index.ts'),
        external: [
          '@huggingface/transformers',
          'onnxruntime-node',
          'onnxruntime-common'
        ]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['@incanta/custom-electron-titlebar'] })],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload/index.ts'),
        output: {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          inlineDynamicImports: true
        }
      }
    }
  },
  renderer: {
    root: '.',
    base: './',
    server: {
      port: 5173,
      host: '127.0.0.1',
      strictPort: false
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    plugins: [
      injectContentSecurityPolicy(),
      stubWebsearchMcpForRenderer(),
      react(),
      tailwindcss()
    ]
  }
})
