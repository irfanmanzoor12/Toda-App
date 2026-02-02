import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3300,
    proxy: {
      // Auth endpoints go to Next.js (Better Auth)
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Chat endpoint goes to Agent API
      '/api/chat': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  }
})
