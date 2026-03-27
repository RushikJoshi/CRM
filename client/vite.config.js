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
            // 🚨 Keep heavy modules separate to prevent bloating the main bundle
            if (id.includes('face-api')) return 'vendor-faceapi';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            
            // ✅ Consolidate React and all other libraries into one chunk
            // This fixes 'Circular chunk' warnings and 'undefined useLayoutEffect' errors
            return 'vendor-main';
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
