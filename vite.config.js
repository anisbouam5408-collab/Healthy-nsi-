import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Served from https://<user>.github.io/Healthy-nsi-/ on GitHub Pages —
  // asset URLs need the repo name as a base path. Local dev/preview stay at "/".
  base: process.env.GITHUB_PAGES ? '/Healthy-nsi-/' : '/',
  plugins: [react()],
  build: {
    sourcemap: false,
  },
})
