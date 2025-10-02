import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MapTelling/',
  // Note: 404.html muss manuell nach dist/ kopiert werden oder via GitHub Actions
})
