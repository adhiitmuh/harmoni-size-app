import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/harmoni-size-app/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl', '@tensorflow-models/pose-detection'],
  },
})
