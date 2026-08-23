import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of micheal-lanham.com. '/' keeps index.html, the
  // favicon/OG paths and the root-absolute asset paths in src consistent.
  base: '/',
  plugins: [react()],
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
        // Split the stable vendor libraries out of the app chunk so a content
        // edit doesn't invalidate the whole 600 KB download for returning visitors.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          motion: ['framer-motion'],
          gsap: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
        },
      },
    },
  },
})
