import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@pipeline': resolve(__dirname, 'src/pipeline'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
          if (id.includes('firebase')) return 'vendor-firebase'
          if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui'
          if (id.includes('@tanstack')) return 'vendor-query'
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
})
