import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize Environment Variables, but fallback to the user-provided key if missing
  const apiKey = env.VITE_API_KEY || env.API_KEY || 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';

  return {
    plugins: [react()],
    server: {
      host: true
    },
    define: {
      // Expose as standard Vite env var for import.meta.env
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      // Backwards compatibility if any library still tries process.env
      'process.env': {
         API_KEY: apiKey
      }
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code into separate chunks for better caching
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react'],
            ai: ['@google/genai']
          }
        }
      }
    }
  }
})