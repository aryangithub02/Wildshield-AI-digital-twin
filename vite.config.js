import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    watch: {
      // Exclude heavy directories, audio files, SQLite WAL files, and backend python files from file watcher to prevent Windows/OneDrive EBUSY locks
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/backend/**',
        '**/runs/**',
        '**/WildShield-Dataset/**',
        '**/Animals Datasets 1/**',
        '**/Animals Datasets 2/**',
        '**/audios/**',
        '**/audio/**',
        '**/firmware/**',
        '**/dist/**',
        '**/*.mp3',
        '**/*.mp4',
        '**/*.wav',
        '**/*.ogg',
        '**/*.db*',
        '**/*.wal*',
        '**/*.shm*',
        '**/*.pt',
        '**/*.docx'
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
