import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/data/pota-au')) return 'pota-au'
          if (id.includes('three')) return 'three'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
