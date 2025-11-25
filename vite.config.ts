
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
      // Also expose as standard Vite env var just in case
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      // Backwards compatibility for code using process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey)
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
