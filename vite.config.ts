import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of micheal-lanham.com. '/' keeps index.html, the
  // favicon/OG paths and the root-absolute asset paths in src consistent.
  base: '/',
  plugins: [react()],
  define: {
    // Fixed when the site is built, so the prerendered footer and the hydrated
    // page agree even after a visitor's clock reaches a new year.
    __BUILD_YEAR__: JSON.stringify(String(new Date().getFullYear())),
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep all third-party code (React, react-dom's client build, React
        // Router) in one chunk so content edits do not invalidate it. The
        // object form missed react-dom/client, which stayed in the app chunk.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
