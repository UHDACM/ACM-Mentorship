import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // alias uses on frontend to import from adjacent directory: /shared
      // required for vite bundler
      "@shared": path.resolve(__dirname, "../shared")
    }
  },
  server: {
    fs: {
      allow: ['../shared']
    },
    port: 5173
  }
})
