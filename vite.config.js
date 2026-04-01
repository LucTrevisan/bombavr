import { BottomBar } from '@babylonjs/inspector/components/actionTabs/tabs/propertyGrids/materials/textures/bottomBar'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    base: '/bombavr/',
    host: '0.0.0.0',
    port: 5173,
    https: false, // Use ngrok for HTTPS tunneling
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    include: [
      '@babylonjs/core',
      '@babylonjs/loaders',
      '@babylonjs/materials',
      '@babylonjs/gui',
    ],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/materials', '@babylonjs/gui'],
        },
      },
    },
  },
})
