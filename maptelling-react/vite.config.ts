import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // If deploying to GitHub Pages at https://fhaefker.github.io/MapTelling/
  // set base to the repository name. Change to '/' for custom domains.
  base: '/MapTelling/',
  server: {
    port: 5174,
    host: true,
  },
});
