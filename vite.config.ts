import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project sites from /<repo>/; the deploy workflow sets BASE_PATH.
  // Local dev and builds stay at the root.
  base: process.env.BASE_PATH || '/',
})
