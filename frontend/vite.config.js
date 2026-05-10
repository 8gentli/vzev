import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,
    host: '0.0.0.0', // Important for docker
    allowedHosts: true, // Allow external devices on the home network to view the dev server
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Docker internal DNS to the backend service
        changeOrigin: true,
      },
    },
  },
})
