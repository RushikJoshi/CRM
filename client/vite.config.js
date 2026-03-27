import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Important for production deployment
  base: '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React core together to avoid circular dependencies with sub-packages
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-core';
            }
            // Separate these large modules to keep the core bundle small
            if (id.includes('face-api')) return 'vendor-faceapi';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            
            // Allow everything else to bundle normally or into a general libs chunk
            return 'vendor-libs';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1600
  },

  server: {
    port: 5173,
    open: true
  }
})
