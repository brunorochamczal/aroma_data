import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'aroma-data.onrender.com',
      '.onrender.com', // Permite todos os subdomínios do Render
      'localhost'
    ]
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: [
      'aroma-data.onrender.com',
      '.onrender.com',
      'localhost'
    ]
  }
})
