import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  // 5173 is taken by another service on this machine; this site uses its own port.
  server: { port: 5180, strictPort: true },
})
