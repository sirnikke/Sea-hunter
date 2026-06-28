import { defineConfig } from 'vite'

// Relative base so the build works from any static host (itch.io, GitHub Pages, S3…)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  server: { host: true }
})
