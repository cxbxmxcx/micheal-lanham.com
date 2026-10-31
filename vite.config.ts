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
        // Cache the framework independently of content updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
        },
      },
    },
  },
})
