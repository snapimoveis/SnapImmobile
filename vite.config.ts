import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  const apiKey = env.VITE_API_KEY || env.API_KEY || '';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
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
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,mp3,wav}']
        }
      })
    ],
    server: {
      host: true
    },
    define: {
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      'process.env': {
         API_KEY: apiKey
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react'],
            // FIX: Changed from '@google/genai' to '@google/generative-ai'
            ai: ['@google/generative-ai']
          }
        }
      }
    }
  };
});
