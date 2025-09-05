import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages deployment base path
// For repository: https://github.com/fhaefker/MapTelling
// The site will be served from: https://fhaefker.github.io/MapTelling/
// Therefore assets must use the /MapTelling/ base
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/MapTelling/' : '/',
  plugins: [react()],
}));
