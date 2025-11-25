import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize VITE_API_KEY, then API_KEY, then check process.env
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    server: {
      host: true
    },
    define: {
      // Expose the API Key securely to the client-side code
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Also expose as standard Vite env var just in case
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey)
    }
  }
})