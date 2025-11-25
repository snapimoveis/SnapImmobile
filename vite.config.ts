import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Define process env type to avoid "Cannot find name 'process'" if @types/node is missing
declare const process: { env: Record<string, string | undefined> };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize Environment Variables, but fallback to the user-provided key if missing
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY || process.env.API_KEY || 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';

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