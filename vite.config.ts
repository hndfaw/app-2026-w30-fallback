/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/app-2026-w30-fallback/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
