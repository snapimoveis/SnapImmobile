import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize Environment Variables, but fallback to the user-provided key if missing
  // Nota: Esta chave hardcoded será usada se não houver variáveis de ambiente no Vercel
  const apiKey = env.VITE_API_KEY || env.API_KEY || 'AIzaSyCPcdh9IHT3A2KCFuB4GFdd0skPFcg0FOM';

  return {
    plugins: [
      react(),
      // Plugin PWA (Progressive Web App) - Mantido para funcionar no telemóvel
      VitePWA({
        registerType: 'autoUpdate', // Tenta atualizar automaticamente
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Snap Immobile',
          short_name: 'SnapImmobile',
          description: 'Gestão de fotografia imobiliária com IA',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          // Opções críticas para evitar "Tela Preta" no telemóvel após deploy
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Inclui mp3/wav no cache para a câmara funcionar offline
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,mp3,wav}'] 
        }
      })
    ],
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
  };
});
