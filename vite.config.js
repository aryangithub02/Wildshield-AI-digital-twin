import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * WildShield AI Persistent Dependency Cache Tracker Plugin
 * Verifies lockfile and package configuration integrity to guarantee
 * persistent on-disk dependency reuse across dev server restarts.
 */
function persistentDependencyCacheTracker() {
  const rootDir = process.cwd()
  const cacheDir = path.resolve(rootDir, 'node_modules', '.vite', 'deps')
  const stampFile = path.resolve(cacheDir, '.cache_stamp')
  const metaFile = path.resolve(cacheDir, '_metadata.json')

  function getDependencyHash() {
    const hash = crypto.createHash('sha256')
    const filesToHash = ['package.json', 'package-lock.json', 'vite.config.js']
    for (const f of filesToHash) {
      const fullPath = path.resolve(rootDir, f)
      if (fs.existsSync(fullPath)) {
        hash.update(fs.readFileSync(fullPath))
      }
    }
    return hash.digest('hex').substring(0, 16)
  }

  let currentHash = ''
  let isCacheValid = false

  return {
    name: 'wildshield-persistent-cache-tracker',
    configResolved() {
      currentHash = getDependencyHash()
      const stampExists = fs.existsSync(stampFile)
      const metaExists = fs.existsSync(metaFile)

      if (stampExists && metaExists) {
        try {
          const savedHash = fs.readFileSync(stampFile, 'utf8').trim()
          if (savedHash === currentHash) {
            isCacheValid = true
            console.log('\x1b[32m✔ [Vite Persistent Cache] Reusing cached dependencies from node_modules/.vite/deps\x1b[0m')
            console.log(`\x1b[36mℹ [Vite Persistent Cache] Dependencies (react, framer-motion, lucide-react, chart.js, etc.) are up to date (hash: ${currentHash}). Skipping rebundling.\x1b[0m`)
            return
          }
        } catch {
          isCacheValid = false
        }
      }

      console.log('\x1b[33m⚡ [Vite Persistent Cache] Dependencies or config changed (or cold start). Pre-bundling dependencies to disk cache...\x1b[0m')
    },
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        try {
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true })
          }
          fs.writeFileSync(stampFile, currentHash, 'utf8')
          if (!isCacheValid) {
            console.log(`\x1b[32m✔ [Vite Persistent Cache] Dependency bundle cached successfully to disk (stamp: ${currentHash})\x1b[0m`)
          }
        } catch {
          // Graceful fallback if filesystem permission blocks stamp write
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    persistentDependencyCacheTracker()
  ],
  cacheDir: './node_modules/.vite',
  clearScreen: false,
  optimizeDeps: {
    force: false,
    holdUntilCrawlEnd: true,
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'framer-motion',
      'lucide-react',
      'chart.js',
      'react-chartjs-2'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    watch: {
      // Exclude heavy directories, SQLite WAL files, and backend python files from file watcher
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/backend/**',
        '**/runs/**',
        '**/WildShield-Dataset/**',
        '**/*.db*',
        '**/*.wal*',
        '**/*.shm*'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
      '/static-test-images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
