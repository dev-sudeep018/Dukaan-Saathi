import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // bind IPv4 + IPv6 so localhost/127.0.0.1 both resolve on Windows
    open: true, // auto-launch the browser on `npm run dev`
    proxy: {
      // dev-time: forward API + webhook calls to the Express backend on :3001
      '/api': 'http://localhost:3001',
      '/webhooks': 'http://localhost:3001',
    },
  },
})
