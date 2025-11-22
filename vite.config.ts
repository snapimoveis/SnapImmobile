import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    server: {
      host: true // Expose to network for iPhone testing
    },
    define: {
      // This ensures process.env.API_KEY is available in the code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback for other process.env accesses if necessary (though rarely needed in Vite)
      'process.env': process.env
    }
  }
})